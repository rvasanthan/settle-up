# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
│              (React/Vue/Angular + Google OAuth)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS API Calls
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Firebase Cloud Functions                    │
│  ┌──────────────┬──────────────┬──────────────────────────┐  │
│  │ Auth Service │ Expense API  │ Dashboard API            │  │
│  │              │              │ Settlement Service       │  │
│  └──────────────┴──────────────┴──────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Read/Write
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Firestore Database                         │
│  ┌──────────────┬──────────────┬──────────────────────────┐  │
│  │ Users        │ Expenses     │ Balances                 │  │
│  │ Collection   │ Collection   │ Collection               │  │
│  └──────────────┴──────────────┴──────────────────────────┘  │
│                                                              │
│  Firestore Security Rules Applied                           │
│  Row-level access control enforced                          │
└──────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Firebase Cloud Functions

**Entry Point: `functions/index.js`**

Exports 5 main HTTP endpoints:
- `auth` - User registration and profile retrieval
- `expenses` - Create, read, delete expenses
- `dashboard` - Get balance summary
- `settleExpense` - Mark expense as paid
- `onUserDeleted` - Cleanup trigger when user account is deleted

### 2. Route Handlers

**`functions/routes/users.js`**
- `registerUser()` - Create new user profile
- `getUser()` - Retrieve user information

**`functions/routes/expenses.js`**
- `createExpense()` - Create expense and balance entries
- `getExpenses()` - Fetch user's expenses
- `deleteExpense()` - Remove expense
- `settleExpense()` - Mark as paid

**`functions/routes/dashboard.js`**
- `getDashboard()` - Get complete balance summary

### 3. Utility Functions

**`functions/utils/auth.js`**
- `verifyToken()` - Verify Firebase ID tokens
- `authMiddleware()` - Express middleware for auth

**`functions/utils/balanceCalculator.js`**
- `calculateUserBalances()` - Compute who owes whom
- `simplifyTransactions()` - Optimize settlement paths

### 4. Database Schema

#### Users Collection
```
/users/{userId}
├── uid: string
├── email: string
├── displayName: string
├── photoURL: string
├── createdAt: timestamp
└── updatedAt: timestamp
```

#### Expenses Collection
```
/expenses/{expenseId}
├── description: string
├── amount: number
├── currency: string
├── createdBy: userId
├── participants: array
│   └── {userId, amount}
├── date: timestamp
├── createdAt: timestamp
└── settled: boolean
```

#### Balances Collection
```
/balances/{balanceId}
├── expenseId: string
├── payerId: userId (who owes)
├── payeeId: userId (who is owed)
├── amount: number
├── currency: string
├── settled: boolean
├── settledAt: timestamp (optional)
└── createdAt: timestamp
```

## Data Flow

### User Registration Flow
```
User Google Sign-In
      ↓
Frontend gets Google credentials
      ↓
POST /auth with user data
      ↓
Cloud Function validates
      ↓
Create user document in Firestore
      ↓
Return user object
```

### Expense Creation Flow
```
User creates expense with participants
      ↓
POST /expenses with expense details
      ↓
Cloud Function validates amounts sum
      ↓
Add document to /expenses collection
      ↓
Create /balances entries for each participant
      ↓
Return expenseId
```

### Dashboard Calculation Flow
```
User requests dashboard
      ↓
GET /dashboard?userId=X
      ↓
Query /balances where payerId=X (unsettled)
      ↓
Query /balances where payeeId=X (unsettled)
      ↓
Fetch user details for each balance
      ↓
Calculate totals
      ↓
Return dashboard with youOwe, youAreOwed, netBalance
```

## Security Architecture

### Authentication
- Google OAuth 2.0 via frontend
- Firebase Authentication handles token verification
- User UID is primary identifier

### Authorization (Firestore Rules)
```
Users:
  - Read: Only self
  - Write: Only self

Expenses:
  - Create: Any authenticated user
  - Read: Creator or participant
  - Update/Delete: Creator only

Balances:
  - Read: Payer or payee
  - Update: Payer or payee
  - Delete: Payer only
```

### Data Protection
- No sensitive data in logs
- Passwords handled by Firebase Auth
- CORS enabled for registered domains
- Row-level security enforced

## Scaling Considerations

### Database Indexes
Composite indexes created for:
- `expenses.createdBy + date`
- `balances.payerId + settled`
- `balances.payeeId + settled`

### Query Optimization
- Filtered queries with indexes
- Only retrieve unsettled balances
- Paging support for large datasets (future)

### Performance
- Cloud Functions auto-scale
- Firestore handles 50K reads/day free tier
- Cold start ~1-3 seconds (acceptable for MVP)

## Error Handling

All endpoints return JSON with `success` flag:
```json
{
  "success": true/false,
  "message": "User friendly message",
  "data": "Response data (optional)",
  "error": "Error details (if success=false)"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Server Error

## Deployment Architecture

### Development
```
firebase emulators:start
├── Functions Emulator (localhost:5001)
└── Firestore Emulator (localhost:8080)
```

### Production
```
Firebase Project
├── Cloud Functions (us-central1)
├── Firestore Database (Regional)
├── Authentication
└── Storage (future)
```

## Integration Points

### Frontend Integration
```javascript
// Use provided SettleUpClient.js
const client = new SettleUpClient(config, googleAuth);
await client.signInWithGoogle();
const dashboard = await client.getDashboard(userId);
```

### Third-Party Services (Future)
- **Stripe**: Payment processing
- **SendGrid**: Email notifications
- **Twilio**: SMS alerts
- **Analytics**: Usage tracking

## Monitoring & Observability

### Metrics to Track
- Function execution time
- Error rates
- Database read/write counts
- Active users
- Peak usage times

### Debugging
- Cloud Function logs
- Firestore console
- Firebase Performance Monitoring
- Browser DevTools

## Cost Structure (Free Tier)
- Cloud Functions: 2M invocations/month
- Firestore: 50K reads/day, 20K writes/day
- Authentication: 200K sign-ups/month
- Estimated cost at 1000 users: $0-15/month

## Future Enhancements

### Short Term
- [ ] Group expenses
- [ ] Payment history
- [ ] Recurring expenses
- [ ] Export functionality

### Long Term
- [ ] Mobile app
- [ ] Real-time notifications
- [ ] Receipt image uploads
- [ ] Integration with payment services
- [ ] Advanced analytics
- [ ] Expense categories
- [ ] Budget tracking

## Related Documentation
- See README.md for API specification
- See DEPLOYMENT.md for deployment steps
- See QUICK_START.md for getting started
