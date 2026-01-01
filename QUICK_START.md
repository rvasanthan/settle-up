# Quick Start Guide

Get your Settle-Up backend running in 10 minutes.

## Prerequisites
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project

## Quick Setup

```bash
cd /Users/vasanth/data/settle-up

# Login to Firebase
firebase login

# Initialize (or use existing project)
firebase use --add

# Install dependencies
cd functions && npm install && cd ..

# Start local emulator
firebase emulators:start --only functions,firestore
```

## Deploy

```bash
firebase deploy
```

## API Quick Reference

### 1. Register User
```bash
curl -X POST http://localhost:5001/PROJECT/us-central1/auth \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "email": "user@example.com",
    "displayName": "John Doe"
  }'
```

### 2. Create Expense
```bash
curl -X POST http://localhost:5001/PROJECT/us-central1/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Dinner",
    "amount": 100,
    "currency": "USD",
    "createdBy": "user123",
    "participants": [
      {"userId": "user123", "amount": 60},
      {"userId": "user456", "amount": 40}
    ]
  }'
```

### 3. Get Dashboard
```bash
curl http://localhost:5001/PROJECT/us-central1/dashboard?userId=user123
```

### 4. Settle Payment
```bash
curl -X POST http://localhost:5001/PROJECT/us-central1/settleExpense \
  -H "Content-Type: application/json" \
  -d '{
    "balanceId": "balance_id",
    "userId": "user123"
  }'
```

## Database Collections

**users** - User profiles  
**expenses** - Expense records  
**balances** - Who owes whom  

## File Structure

```
settle-up/
├── functions/
│   ├── index.js           # Main endpoints
│   ├── routes/            # Endpoint handlers
│   ├── utils/             # Helper functions
│   └── package.json       # Dependencies
├── database/
│   ├── firestore.rules    # Security rules
│   └── firestore.indexes.json
├── config/
│   └── firebase.config.js # Configuration
├── README.md              # Full documentation
├── DEPLOYMENT.md          # Deployment guide
└── firebase.json          # Firebase config
```

## Next Steps

1. ✅ Deploy functions: `firebase deploy --only functions`
2. ✅ Deploy rules: `firebase deploy --only firestore:rules`
3. ✅ Build frontend with provided SettleUpClient.js
4. ✅ Enable Google OAuth
5. ✅ Connect frontend to backend

## Documentation

- **Full README**: See README.md for complete API documentation
- **Deployment Guide**: See DEPLOYMENT.md for production setup
- **Client Example**: See client/SettleUpClient.js for frontend integration

## Helpful Commands

```bash
# View function logs
firebase functions:log

# Deploy specific component
firebase deploy --only functions:auth

# Force redeploy
firebase deploy --force

# Emulate locally
firebase emulators:start

# Open Firestore console
firebase open firestore
```

## Support

Refer to full documentation in README.md for:
- Complete API endpoint specifications
- Error handling
- Security rules details
- Troubleshooting guide
- Performance optimization
- Testing procedures
