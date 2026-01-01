# API Flow Diagrams

## 1. User Registration Flow

```
┌─────────────────┐
│  Google OAuth   │
│   (Frontend)    │
└────────┬────────┘
         │
         │ Get user credentials
         │
         ▼
┌─────────────────────────────────┐
│  POST /auth                     │
│  {                              │
│    uid: google_id              │
│    email: user@example.com     │
│    displayName: John Doe       │
│  }                              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Cloud Function: registerUser   │
│  - Validate input              │
│  - Check if user exists        │
│  - Create user document        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Firestore                      │
│  /users/{uid}                   │
│  {                              │
│    uid, email, displayName,    │
│    photoURL, createdAt         │
│  }                              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Response (201)                 │
│  {                              │
│    success: true               │
│    user: {...}                 │
│  }                              │
└─────────────────────────────────┘
```

## 2. Create Expense Flow

```
┌────────────────────────────────────┐
│  User adds expense                 │
│  - Description: "Dinner"           │
│  - Amount: 100                     │
│  - Participants: [user1, user2]   │
└────────┬─────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  POST /expenses                    │
│  {                                 │
│    description, amount, currency  │
│    createdBy, participants, date  │
│  }                                 │
└────────┬─────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Cloud Function: createExpense    │
│  - Validate amounts sum           │
│  - Verify participants            │
│  - Create expense document        │
│  - Create balance entries         │
└────────┬─────────────────────────┘
         │
         ├─────────────────┬──────────────────┐
         │                 │                  │
         ▼                 ▼                  ▼
    ┌─────────┐    ┌──────────┐    ┌──────────────┐
    │ /expenses│    │/balances │    │/balances     │
    │ {id}     │    │ {user1   │    │ {user2 owes} │
    │ New doc  │    │  owes}   │    │              │
    └────┬─────┘    └────┬─────┘    └────┬─────────┘
         │                │               │
         └────────┬───────┴───────┬───────┘
                  │               │
                  ▼               ▼
         ┌──────────────────────────────┐
         │  Response (201)              │
         │  {                           │
         │    expenseId: "abc123"      │
         │    success: true            │
         │  }                           │
         └──────────────────────────────┘
```

## 3. Dashboard Calculation Flow

```
┌─────────────────────────────────────┐
│  GET /dashboard?userId=user123      │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Cloud Function: getDashboard      │
├─────────────────────────────────────┤
│  1. Fetch user document            │
└────────┬────────────────────────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
    ┌──────────────────┐          ┌─────────────────────┐
    │ Query /balances  │          │ Query /balances     │
    │ WHERE            │          │ WHERE               │
    │  payerId=user123 │          │  payeeId=user123    │
    │  && settled=false│          │  && settled=false   │
    │                  │          │                     │
    │ Result: YouOwe   │          │ Result: YouAreOwed  │
    └────────┬─────────┘          └──────────┬──────────┘
             │                               │
             └───────────────┬───────────────┘
                             │
                             ▼
            ┌────────────────────────────────┐
            │ For each balance:              │
            │ - Fetch payer/payee user doc  │
            │ - Add to youOwe/youAreOwed    │
            │ - Calculate totals            │
            │ - Calc netBalance = owed - owe│
            └────────────┬───────────────────┘
                         │
                         ▼
            ┌────────────────────────────────┐
            │  Response (200)                │
            │  {                             │
            │    user: {...},               │
            │    summary: {                 │
            │      totalYouOwe: 150,        │
            │      totalYouAreOwed: 75,     │
            │      netBalance: -75          │
            │    },                         │
            │    youOwe: [...],             │
            │    youAreOwed: [...]          │
            │  }                             │
            └────────────────────────────────┘
```

## 4. Settle Expense Flow

```
┌───────────────────────────────────────┐
│  User pays back: "Balance settled"    │
└────────┬─────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────┐
│  POST /settleExpense                  │
│  {                                    │
│    balanceId: "balance123"           │
│    userId: "user_who_paid"           │
│  }                                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────┐
│  Cloud Function: settleExpense       │
│  - Verify user is payer              │
│  - Update balance document           │
│  - Set settled=true                  │
│  - Set settledAt=timestamp           │
└────────┬─────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────┐
│  Firestore                            │
│  /balances/{balanceId}                │
│  UPDATE {                             │
│    settled: true,                    │
│    settledAt: now()                  │
│  }                                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────┐
│  Response (200)                       │
│  {                                    │
│    success: true,                    │
│    message: "Expense settled"        │
│  }                                    │
└───────────────────────────────────────┘
```

## 5. Delete Expense Flow

```
┌────────────────────────────────────┐
│  User deletes expense              │
│  (Only creator can delete)         │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  DELETE /expenses                  │
│  ?expenseId=abc123&userId=user123  │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│  Cloud Function: deleteExpense    │
│  - Verify user is creator         │
│  - Check expense exists           │
│  - Delete balance entries         │
│  - Delete expense document        │
└────────┬───────────────────────────┘
         │
         ├──────────────┬──────────────┐
         │              │              │
         ▼              ▼              ▼
    ┌─────────┐  ┌──────────┐  ┌──────────┐
    │ /expenses│  │/balances │  │/balances │
    │ DELETE   │  │ DELETE   │  │ DELETE   │
    └────┬─────┘  └────┬─────┘  └────┬─────┘
         │              │             │
         └──────┬───────┴──────┬──────┘
                │              │
                ▼              ▼
        ┌──────────────────────────────┐
        │  Response (200)              │
        │  {                           │
        │    success: true,           │
        │    message: "Deleted"       │
        │  }                           │
        └──────────────────────────────┘
```

## 6. Data Model Relationships

```
┌──────────────────┐
│  Users           │
├──────────────────┤
│ uid (PK)         │
│ email            │
│ displayName      │
│ photoURL         │
│ createdAt        │
│ updatedAt        │
└────────┬─────────┘
         │
         │ 1:N
         │ createdBy
         │
         ▼
┌──────────────────────┐      ┌──────────────────┐
│  Expenses            │      │  Balances        │
├──────────────────────┤      ├──────────────────┤
│ id (PK)              │  1:N │ id (PK)          │
│ description          │◄─────┤ expenseId (FK)   │
│ amount               │      │ payerId (FK)     │
│ currency             │      │ payeeId (FK)     │
│ createdBy (FK)       │      │ amount           │
│ participants (array) │      │ currency         │
│ date                 │      │ settled          │
│ settled              │      │ settledAt        │
│ createdAt            │      │ createdAt        │
└──────────────────────┘      └──────────────────┘
         ▲                              ▲
         │                              │
         │         1:N                  │
         │         payerId, payeeId     │
         │         (both FK to Users)   │
         │                              │
         └──────────────────────────────┘
```

## 7. Authentication & Security Flow

```
┌─────────────────────────┐
│  User Signs in Google   │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Google OAuth                    │
│  - Gets ID token                │
│  - Session established          │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Frontend includes token in      │
│  Authorization header            │
│  "Bearer {google_id_token}"      │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Cloud Function                  │
│  - Extract user UID from token   │
│  - Use UID for data access       │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Firestore Security Rules        │
│  - Check if user owns data       │
│  - Allow/deny based on rules     │
│  - Row-level access control      │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Return data or 403 Forbidden    │
└──────────────────────────────────┘
```

## Legend

- `┌─────────┐` = Process/Component
- `─────►` = Data flow
- `PK` = Primary Key
- `FK` = Foreign Key
- `1:N` = One-to-Many relationship
