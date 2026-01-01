# Deployment Guide

This guide walks you through deploying the Settle-Up Firebase backend.

## Step-by-Step Deployment

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `settle-up` (or your preferred name)
4. Accept the terms and create project
5. Wait for project creation to complete

### 2. Enable Services

In Firebase Console:

#### Enable Firestore Database
- Navigate to "Firestore Database"
- Click "Create database"
- Select "Start in production mode"
- Choose region (e.g., `us-central1`)
- Click "Enable"

#### Enable Cloud Functions
- Navigate to "Cloud Functions"
- No setup needed, just ensure it's available

#### Enable Authentication
- Navigate to "Authentication"
- Click "Get started"
- Click on "Google" provider
- Enable it and add your app's support email

### 3. Set Up Local Environment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Navigate to project directory
cd /Users/vasanth/data/settle-up

# Initialize Firebase project
firebase init

# When prompted, select:
# - Firestore: Yes
# - Functions: Yes
# - Choose existing project
# - JavaScript/TypeScript: JavaScript
# - ESLint: No (or Yes if you want)
# - Install dependencies: Yes
```

### 4. Configure Project

```bash
# Set your Firebase project
firebase use --add

# Select your project from the list
# Give it an alias (e.g., 'default')
```

### 5. Install Dependencies

```bash
# Install function dependencies
cd functions
npm install
cd ..
```

### 6. Configure Environment Variables

Create `.env.local` in functions directory:

```bash
cd functions
cp ../.env.example .env.local
```

Edit `.env.local` with your Firebase project credentials from:
- Firebase Console > Project Settings > Service Accounts
- Firebase Console > Project Settings > Your apps > Web

### 7. Test Locally

```bash
# Start the emulator
firebase emulators:start --only functions,firestore

# In another terminal, test endpoints
curl -X POST http://localhost:5001/your-project/us-central1/auth \
  -H "Content-Type: application/json" \
  -d '{"uid":"test123","email":"test@example.com","displayName":"Test"}'
```

### 8. Deploy to Firebase

```bash
# From project root
firebase deploy

# Or deploy specific components
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 9. Verify Deployment

```bash
# Check function logs
firebase functions:log

# Verify Firestore is set up
# Go to Firebase Console > Firestore Database
# You should see empty collections ready for data
```

## Post-Deployment Configuration

### 1. Enable Google OAuth

In Firebase Console:
1. Project Settings > Authentication > Google Provider
2. Add your frontend domain to authorized redirect URIs
3. Download Web SDK configuration

### 2. Set CORS Configuration (Optional)

If using from specific domains, update CORS in `functions/index.js`:

```javascript
const corsHandler = cors({
  origin: ['https://yourfrontend.com'],
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
});
```

### 3. Configure Firestore Backup

In Firebase Console:
1. Go to Firestore Database > Settings
2. Enable automatic backups
3. Set backup location and frequency

## Monitoring & Debugging

### View Logs
```bash
firebase functions:log
```

### Set Up Error Reporting
In Firebase Console > Error Reporting, you'll see any runtime errors

### Monitor Performance
In Firebase Console > Performance Monitoring, track function latency and errors

## Troubleshooting Deployments

### Issue: "Permission denied"
- Ensure you have "Editor" or "Cloud Functions Admin" role
- Check: `gcloud projects get-iam-policy <PROJECT_ID>`

### Issue: "Quota exceeded"
- Check Firebase billing plan
- Monitor usage in Firebase Console > Usage

### Issue: "Functions not deploying"
- Verify `firebase.json` is correctly configured
- Check for syntax errors: `cd functions && npm run build`
- Ensure Node version is 18+

### Issue: "Firestore queries failing"
- Check security rules in Firestore Console
- Verify indexes are deployed: `firebase deploy --only firestore:indexes`

## Next Steps

1. ✅ Deploy backend API
2. Build frontend application (React/Vue/Angular)
3. Configure Google OAuth in frontend
4. Connect frontend to deployed API
5. Test end-to-end flows
6. Set up monitoring and alerts
7. Configure database backups

## Rollback

If something goes wrong:

```bash
# Revert to previous version
firebase deploy --only functions --force

# Or redeploy specific function
firebase deploy --only functions:auth
```

## Cost Optimization

To keep costs low during development:

1. Use Firestore's free tier (up to 50,000 reads/day)
2. Optimize database queries with proper indexing
3. Use Cloud Functions' generous free tier
4. Monitor usage in Firebase Console
5. Set up billing alerts

## Security Checklist

- ✅ Firestore security rules implemented
- ✅ Row-level security enforced
- [ ] Configure CORS for production
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Configure key management
- [ ] Regular security reviews

## Production Deployment

Before going live:

1. Enable billing (if exceeding free tier)
2. Set up monitoring and alerts
3. Configure error reporting
4. Implement request logging
5. Set up automated backups
6. Document API endpoints
7. Create runbooks for common issues
8. Test disaster recovery procedures

## Support

For deployment issues:
- Check [Firebase Documentation](https://firebase.google.com/docs)
- Review [Cloud Functions Documentation](https://cloud.google.com/functions/docs)
- Check Firebase Console for error messages
