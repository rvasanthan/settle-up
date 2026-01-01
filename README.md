# Firebase Backend for Settle-Up (Splitwise MVP)

A serverless backend API built with Firebase for a Splitwise-like expense sharing application.

## Features

✅ **User Management**
- Register users with Google authentication
- User profile management

✅ **Expense Management**
- Create expenses and split among multiple users
- Track who paid and how much each person owes
- Delete expenses (by creator only)
- Settle/mark expenses as paid

✅ **Dashboard**
- View balance summaries
- See who you owe money to
- See who owes you money
- Real-time balance calculations

## Architecture

```
Firebase Backend
├── Cloud Functions (Node.js)
│   ├── Authentication endpoints
│   ├── Expense management
│   ├── Dashboard/Balance queries
│   └── Settlement logic
├── Firestore Database
│   ├── Users collection
│   ├── Expenses collection
│   ├── Balances collection
│   └── Settings collection
└── Security Rules
    └── Row-level security enforcement
```

## Database Schema

### Users Collection
```json
{
  "uid": "string (document ID)",
  "email": "string",
  "displayName": "string",
  "photoURL": "string (optional)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Expenses Collection
```json
{
  "id": "string (document ID)",
  "description": "string",
  "amount": "number",
  "currency": "string (e.g., 'USD')",
  "createdBy": "string (user ID)",
  "participants": [
    {
      "userId": "string",
      "amount": "number"
    }
  ],
  "date": "timestamp",
  "createdAt": "timestamp",
  "settled": "boolean"
}
```

### Balances Collection
```json
{
  "id": "string (document ID)",
  "expenseId": "string",
  "payerId": "string (who paid/owes)",
  "payeeId": "string (who received/is owed)",
  "amount": "number",
  "currency": "string",
  "settled": "boolean",
  "settledAt": "timestamp (optional)",
  "createdAt": "timestamp"
}
```

## Setup Instructions

### 1. Prerequisites
- Node.js 18 or higher
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (create at https://console.firebase.google.com)

### 2. Initialize Firebase Project
```bash
cd /Users/vasanth/data/settle-up

# Login to Firebase
firebase login

# Initialize Firebase
firebase init
```

### 3. Set Firebase Project
```bash
firebase use --add
# Select your project ID
```

### 4. Install Dependencies
```bash
cd functions
npm install
cd ..
```

### 5. Set Environment Variables
Create a `.env` file in the functions directory:
```bash
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

### 6. Deploy to Firebase
```bash
# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Firestore Rules
firebase deploy --only firestore:rules

# Deploy Firestore Indexes
firebase deploy --only firestore:indexes
```

## API Endpoints

### Authentication

#### Register User
```http
POST /auth
Content-Type: application/json

{
  "uid": "google_user_id",
  "email": "user@example.com",
  "displayName": "John Doe",
  "photoURL": "https://example.com/photo.jpg"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": { ... }
}
```

#### Get User Profile
```http
GET /auth?uid=google_user_id
```

**Response (200):**
```json
{
  "success": true,
  "user": { ... }
}
```

### Expenses

#### Create Expense
```http
POST /expenses
Content-Type: application/json

{
  "description": "Dinner",
  "amount": 100,
  "currency": "USD",
  "createdBy": "user_id_1",
  "date": "2024-01-15",
  "participants": [
    { "userId": "user_id_1", "amount": 60 },
    { "userId": "user_id_2", "amount": 40 }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Expense created successfully",
  "expenseId": "expense_id",
  "expense": { ... }
}
```

#### Get User's Expenses
```http
GET /expenses?userId=user_id&groupId=optional_group_id
```

**Response (200):**
```json
{
  "success": true,
  "expenses": [ ... ]
}
```

#### Delete Expense
```http
DELETE /expenses?expenseId=expense_id&userId=user_id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

#### Settle Expense (Mark as Paid)
```http
POST /settleExpense
Content-Type: application/json

{
  "balanceId": "balance_id",
  "userId": "user_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Expense settled successfully"
}
```

### Dashboard

#### Get User Dashboard
```http
GET /dashboard?userId=user_id
```

**Response (200):**
```json
{
  "success": true,
  "dashboard": {
    "user": {
      "uid": "user_id",
      "displayName": "John Doe",
      "email": "john@example.com",
      "photoURL": "..."
    },
    "summary": {
      "totalYouOwe": 150,
      "totalYouAreOwed": 75,
      "netBalance": -75,
      "currency": "USD"
    },
    "youOwe": [
      {
        "id": "balance_id",
        "amount": 150,
        "to": { "uid": "user_2", "name": "Jane Doe", "email": "jane@example.com" },
        "description": "Dinner",
        "createdAt": "..."
      }
    ],
    "youAreOwed": [
      {
        "id": "balance_id",
        "amount": 75,
        "from": { "uid": "user_3", "name": "Bob Smith", "email": "bob@example.com" },
        "description": "Movie tickets",
        "createdAt": "..."
      }
    ]
  }
}
```

## Firestore Security Rules

The application uses row-level security with the following rules:

- **Users**: Can only read/write their own profile
- **Expenses**: Creator can read/write, participants can read
- **Balances**: Payer and payee can read/update, creator can delete
- **Default**: All other access is denied

## Testing

### Local Testing with Firebase Emulator
```bash
# Start emulator
firebase emulators:start --only functions,firestore

# Run tests (after implementing test suite)
cd functions
npm test
```

### Example cURL Requests

```bash
# Register user
curl -X POST http://localhost:5001/your-project/us-central1/auth \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "email": "user@example.com",
    "displayName": "John Doe"
  }'

# Create expense
curl -X POST http://localhost:5001/your-project/us-central1/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Lunch",
    "amount": 50,
    "currency": "USD",
    "createdBy": "user123",
    "participants": [
      { "userId": "user123", "amount": 30 },
      { "userId": "user456", "amount": 20 }
    ]
  }'

# Get dashboard
curl http://localhost:5001/your-project/us-central1/dashboard?userId=user123
```

## Project Structure

```
settle-up/
├── functions/
│   ├── index.js                 # Main entry point
│   ├── package.json             # Dependencies
│   ├── routes/
│   │   ├── users.js            # User endpoints
│   │   ├── expenses.js         # Expense endpoints
│   │   └── dashboard.js        # Dashboard endpoints
│   └── utils/
│       ├── auth.js             # Authentication helpers
│       └── balanceCalculator.js # Balance calculation logic
├── database/
│   ├── firestore.rules         # Security rules
│   └── firestore.indexes.json  # Database indexes
├── config/
│   └── firebase.config.js      # Firebase configuration
├── firebase.json               # Firebase project config
└── README.md                   # This file
```

## Future Enhancements

- [ ] Group expenses (expenses shared within a group)
- [ ] Payment tracking with Stripe integration
- [ ] Notifications system
- [ ] Expense categories and tags
- [ ] Receipt image uploads
- [ ] Export reports
- [ ] Mobile app integration
- [ ] Real-time updates with Firestore listeners
- [ ] Unit tests and integration tests
- [ ] Rate limiting and request validation

## Deployment Checklist

- [ ] Set up Firebase project
- [ ] Configure environment variables
- [ ] Enable Google Authentication in Firebase Console
- [ ] Deploy Firestore indexes
- [ ] Deploy security rules
- [ ] Deploy Cloud Functions
- [ ] Test all endpoints
- [ ] Monitor Cloud Function logs
- [ ] Set up error reporting

## Troubleshooting

### "Permission denied" errors
- Check Firestore security rules
- Verify user is authenticated
- Ensure user IDs match correctly

### "Quota exceeded" errors
- Check Firebase billing and quotas
- Implement request rate limiting in frontend

### Cold start issues
- Cloud Functions take ~1-3 seconds on cold start
- Implement exponential backoff in client

## Security Best Practices

1. ✅ Row-level security implemented in Firestore rules
2. ✅ User authentication required for all operations
3. ✅ Only creators can delete expenses
4. ✅ Balance updates limited to involved parties
5. Recommended: Enable CORS restrictions in production
6. Recommended: Implement request signing for API calls

## License

MIT

## Support

For issues and questions, please create an issue in the repository.
