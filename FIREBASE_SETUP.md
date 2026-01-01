# Firebase Project Setup Guide

Follow these steps to create a Firebase project and deploy Settle-Up.

## Prerequisites

- ✅ Firebase CLI installed (done)
- Google account
- Firebase project (will create)

## Step 1: Create Firebase Project

### Option A: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. Enter project name: `settle-up` (or your preferred name)
4. Accept Google Analytics (optional)
5. Click **"Create project"**
6. Wait for project creation to complete (~2 minutes)

### Option B: Using Firebase CLI

```bash
firebase projects:create settle-up
```

## Step 2: Enable Required Services

Once your project is created, enable these services:

### Enable Firestore Database

1. In Firebase Console, select your project
2. Navigate to **"Build"** → **"Firestore Database"**
3. Click **"Create Database"**
4. Choose deployment region (e.g., `us-central1`)
5. Select **"Start in production mode"**
6. Click **"Enable"**

### Enable Cloud Functions (Optional for now)

1. Navigate to **"Build"** → **"Cloud Functions"**
2. It should be available automatically (no setup needed)

### Enable Authentication

1. Navigate to **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Click on **"Google"** provider
4. Toggle "Enable"
5. Add a support email
6. Click **"Save"**

## Step 3: Deploy Firestore Resources

Now deploy the database configuration:

### Option A: Using the Deployment Script

```bash
cd /Users/vasanth/data/settle-up
chmod +x deploy-firestore.sh
./deploy-firestore.sh
```

The script will:
1. Check Firebase CLI
2. Log you in
3. Link your project
4. Deploy indexes
5. Deploy security rules

### Option B: Manual Deployment

```bash
cd /Users/vasanth/data/settle-up

# Step 1: Login to Firebase
firebase login

# Step 2: Link your project
firebase use --add
# Select your project from the list

# Step 3: Deploy indexes
firebase deploy --only firestore:indexes

# Step 4: Deploy security rules
firebase deploy --only firestore:rules
```

## Step 4: Verify Deployment

After deployment, verify everything is working:

### Check Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **"Firestore Database"**
4. You should see empty collections ready for data

### Check Security Rules

1. Click on **"Rules"** tab in Firestore
2. You should see your custom security rules deployed

### Check Indexes

1. Click on **"Indexes"** tab in Firestore
2. You should see 3 composite indexes deployed

## Step 5: Get Your Project Credentials

You'll need these for the frontend. Get them from:

1. Project Settings (⚙️ icon in Firebase Console)
2. Click your project name
3. Click **"Project settings"**
4. Scroll to "Your apps" section
5. Click **"Add app"** if needed
6. Select **"Web"**
7. Copy the configuration object

Example Firebase config:
```javascript
{
  apiKey: "your_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "your_messaging_sender_id",
  appId: "your_app_id"
}
```

## Step 6: Configure Environment Variables

Create a `.env.local` file in `functions/` directory:

```bash
cd functions
cp ../.env.example .env.local
```

Edit `.env.local` and fill in your Firebase project credentials.

## Troubleshooting

### Issue: "Not Authenticated"

```bash
firebase logout
firebase login
```

### Issue: "Project not found"

```bash
firebase use --add
# Select your project correctly
```

### Issue: "Permission denied"

1. Check you have Owner/Editor role in the project
2. Go to [GCP Console](https://console.cloud.google.com)
3. Select your project
4. Go to IAM & Admin
5. Check your user has required permissions

### Issue: "Firestore not enabled"

Enable it in Firebase Console → Firestore Database → Create Database

## Verification Checklist

After deployment, verify:

- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] 3 indexes deployed
- [ ] Security rules active
- [ ] Authentication (Google) enabled
- [ ] `.firebaserc` file exists
- [ ] Environment variables configured

## What's Next

Once Firestore is deployed:

1. ✅ Database setup complete
2. Deploy Cloud Functions: `firebase deploy --only functions`
3. Build frontend with SettleUpClient.js
4. Test end-to-end flows
5. Monitor and optimize

## Database Collections

These will be created automatically on first write:

- **users** - User profiles
- **expenses** - Expense records  
- **balances** - Balance tracking

Your Firestore database is now ready to receive data! 🎉

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Setup Guide](https://firebase.google.com/docs/firestore/quickstart)
- Check DEPLOYMENT.md for more details

---

Continue to the next step once Firestore is deployed!
