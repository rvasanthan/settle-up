# Quick Firebase Deployment Guide

Your environment is ready! Follow these steps to deploy Firestore.

## Environment Status ✅

- ✅ Node.js 20.19.6 installed
- ✅ Firebase CLI 15.1.0 installed
- ✅ Firebase project files ready

## Deployment Steps (Takes ~10 minutes)

### Step 1: Create Firebase Project (5 minutes)

**Option A: Firebase Console (Easiest)**

1. Go to https://console.firebase.google.com
2. Click **"Create a project"**
3. Enter project name: `settle-up`
4. Click **"Continue"**
5. Disable Google Analytics (unless you want it)
6. Click **"Create project"**
7. **Wait for project creation to complete** (takes ~2 minutes)

**Option B: Get an Existing Project**
- If you already have a Firebase project, use that instead

### Step 2: Enable Firestore Database (3 minutes)

1. In Firebase Console, open your project
2. Left sidebar → **"Build"** → **"Firestore Database"**
3. Click **"Create Database"**
4. Select region: **`us-central1`** (or nearest to you)
5. Select **"Start in production mode"**
6. Click **"Enable"**
7. **Wait for Firestore to be created** (takes ~1-2 minutes)

### Step 3: Deploy to Firebase (2 minutes)

Run these commands in your terminal:

```bash
# Make sure you're in the right directory
cd /Users/vasanth/data/settle-up

# Step 1: Set up Node 20 (if in new terminal)
source ~/.nvm/nvm.sh
nvm use 20

# Step 2: Login to Firebase
firebase login

# Step 3: Link your project
firebase use --add
# → Select your "settle-up" project from the list
# → Give it an alias (e.g., "default")

# Step 4: Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Step 5: Deploy security rules
firebase deploy --only firestore:rules

# Step 6: Verify
echo "✅ Deployment complete!"
```

## What Gets Deployed

### Database Collections (Auto-created)
- **users** - Stores user profiles
- **expenses** - Stores expense records
- **balances** - Tracks who owes whom

### Firestore Indexes (3 total)
1. `expenses.createdBy + date` - For listing user expenses
2. `balances.payerId + settled` - For finding outstanding debts
3. `balances.payeeId + settled` - For finding owed amounts

### Security Rules
- Users can only read/write their own data
- Expenses readable by participants
- Balances readable by payer/payee
- Default: Deny all access

## Troubleshooting

### "Not authenticated" error
```bash
firebase logout
firebase login
# This will open a browser to authenticate
```

### "Project not found"
```bash
firebase use --add
# Select your project from the list
```

### "Port already in use"
```bash
# Kill the process using the port
lsof -i :9099
kill -9 <PID>
```

## Verification

After deployment, check everything worked:

```bash
# Option 1: Firebase Console
# 1. Go to https://console.firebase.google.com
# 2. Select your project
# 3. Go to Firestore Database
# 4. Check "Rules" tab - should show your custom rules
# 5. Check "Indexes" tab - should show 3 indexes

# Option 2: Firebase CLI
firebase firestore:indexes
# Should show 3 deployed indexes
```

## What's Next

After Firestore is deployed:

1. ✅ **Firestore Database** - DONE
2. **Cloud Functions** - Deploy later with: `firebase deploy --only functions`
3. **Frontend** - Build your UI and integrate SettleUpClient.js
4. **Testing** - Use the test scenarios in TESTING.md

## Quick Reference

```bash
# Deploy everything
firebase deploy

# Deploy only specific components
firebase deploy --only firestore:rules      # Security rules
firebase deploy --only firestore:indexes    # Database indexes
firebase deploy --only functions           # Cloud Functions

# View deployment status
firebase deploy --dry-run

# View logs
firebase functions:log

# Logout
firebase logout
```

## Important Notes

⚠️ **In Production Mode:**
- All reads/writes are denied by default
- Your security rules control access
- This is secure by design

✅ **Your app will work because:**
- Security rules allow authenticated users to access their own data
- Frontend will send valid authentication tokens
- Firestore will verify permissions automatically

## Environment Setup Command

If you open a new terminal, run this first:

```bash
source ~/.nvm/nvm.sh && nvm use 20
```

Or add to your shell profile (`.zshrc`):
```bash
# NVM setup
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Use Node 20 by default
nvm use 20
```

## Need Help?

- Firebase Docs: https://firebase.google.com/docs
- Firestore Guide: https://firebase.google.com/docs/firestore/quickstart
- Security Rules: https://firebase.google.com/docs/firestore/security/start

---

**You're ready to deploy! Start with Step 1 above.** 🚀
