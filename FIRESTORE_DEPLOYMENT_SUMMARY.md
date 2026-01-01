# Firestore Deployment Summary

Everything is ready to deploy your database to Firebase!

## ✅ What's Ready

### Environment
- ✅ Node.js 20.19.6 installed
- ✅ Firebase CLI 15.1.0 installed
- ✅ All project files prepared

### Database Files
- ✅ `database/firestore.rules` - Security rules
- ✅ `database/firestore.indexes.json` - Composite indexes
- ✅ `firebase.json` - Firebase configuration

## 📋 Deployment Checklist

Follow these 6 steps in order:

### Step 1: Create Firebase Project ⏳
**Time: 5 minutes**

1. Open https://console.firebase.google.com
2. Click "Create a project"
3. Name: `settle-up`
4. Disable Google Analytics
5. Click "Create project"
6. Wait for project creation (green checkmark)

**Status**: ⏳ TODO

### Step 2: Enable Firestore Database ⏳
**Time: 3 minutes**

1. Select your project in Firebase Console
2. Left sidebar → "Build" → "Firestore Database"
3. Click "Create Database"
4. Region: `us-central1`
5. Mode: "Start in production mode"
6. Click "Enable"
7. Wait for database creation (green checkmark)

**Status**: ⏳ TODO

### Step 3: Setup Node 20 ⏳
**Time: 1 minute**

```bash
source ~/.nvm/nvm.sh && nvm use 20
```

This ensures you're using the correct Node version.

**Status**: ⏳ TODO

### Step 4: Login & Link Project ⏳
**Time: 2 minutes**

```bash
firebase login
# Opens browser for authentication - complete the login

firebase use --add
# Select 'settle-up' project
# Alias: default
```

**Status**: ⏳ TODO

### Step 5: Deploy Firestore ✅
**Time: 2 minutes**

```bash
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules
```

This deploys:
- 3 composite indexes (for optimal queries)
- Security rules (row-level access control)

**Status**: ⏳ TODO

### Step 6: Verify Deployment ✅
**Time: 1 minute**

Check in Firebase Console:
1. Select 'settle-up' project
2. Go to Firestore Database
3. Click "Indexes" tab
4. Should show 3 deployed indexes:
   - `expenses.createdBy + date`
   - `balances.payerId + settled`
   - `balances.payeeId + settled`

5. Click "Rules" tab
6. Should show your custom security rules

**Status**: ⏳ TODO

## 🎯 What Gets Deployed

### Database Collections (auto-created)
```
Firestore
├── users/
│   └── {userId}
│       ├── uid
│       ├── email
│       ├── displayName
│       └── ...
├── expenses/
│   └── {expenseId}
│       ├── description
│       ├── amount
│       ├── participants[]
│       └── ...
└── balances/
    └── {balanceId}
        ├── payerId
        ├── payeeId
        ├── amount
        └── ...
```

### Firestore Indexes (deployed immediately)
```
1. expenses.createdBy + date (for listing user expenses)
2. balances.payerId + settled (for finding debts)
3. balances.payeeId + settled (for finding owed amounts)
```

### Security Rules (deployed immediately)
- Users can only read/write their own data
- Expenses readable by creator and participants
- Balances readable by payer and payee
- Default: Deny all access (secure by default)

## 📚 Quick Reference Commands

```bash
# Setup (do once)
source ~/.nvm/nvm.sh && nvm use 20
firebase login
firebase use --add

# Deploy
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules

# Deploy everything (later)
firebase deploy

# Check status
firebase firestore:indexes
firebase deploy --dry-run

# Logout
firebase logout
```

## 🚨 Important Notes

### In Production Mode
- All access is **DENIED by default**
- Your security rules control what's allowed
- This is secure by design ✅

### Your App Will Work Because
- Security rules allow authenticated users to access their own data
- Frontend will send valid Firebase auth tokens
- Firestore verifies permissions automatically

### Free Tier Limits
- Cloud Functions: 2M invocations/month
- Firestore: 50K reads/day, 20K writes/day
- Authentication: 200K sign-ups/month
- Perfect for MVP!

## ✨ Next Steps After Deployment

Once Firestore is deployed:

1. ✅ Firestore database - DONE
2. Deploy Cloud Functions: `firebase deploy --only functions`
3. Build your frontend
4. Test end-to-end flows
5. Monitor and optimize

## 🆘 Troubleshooting

### "Permission denied" during firebase deploy
```bash
firebase logout
firebase login
```

### "Project not found" error
```bash
firebase use --add
# Select settle-up from the list
```

### "Firestore not enabled" error
- Go to Firebase Console → Firestore Database → Create Database
- Make sure to complete the setup

### "Command not found: firebase"
```bash
source ~/.nvm/nvm.sh && nvm use 20
```

## 📞 Need Help?

- Firebase Docs: https://firebase.google.com/docs
- Firestore Guide: https://firebase.google.com/docs/firestore
- Security Rules: https://firebase.google.com/docs/firestore/security
- See `FIREBASE_DEPLOY_QUICK.md` for detailed guide

---

## 🎬 Let's Begin!

**Ready?** Start with Step 1 above by visiting:
https://console.firebase.google.com

**Total time**: ~15 minutes from start to finish
**Main wait**: Firebase Console creating project/database (~5 minutes)
**Active work**: Just copy-paste commands (~2 minutes)

You've got this! 🚀
