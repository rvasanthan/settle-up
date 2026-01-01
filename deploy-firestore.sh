#!/bin/bash

# Settle-Up Firebase Deployment Script
# This script deploys Firestore database, rules, and indexes to Firebase

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       SETTLE-UP FIREBASE DEPLOYMENT SETUP                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check Firebase CLI
echo "Step 1: Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi
echo "✅ Firebase CLI is installed"
echo ""

# Step 2: Login to Firebase
echo "Step 2: Login to Firebase..."
echo "You will be prompted to login. A browser window will open."
echo "Please complete the authentication process."
echo ""
firebase login

echo ""
echo "✅ Firebase login successful"
echo ""

# Step 3: Initialize Firebase project
echo "Step 3: Initialize Firebase project..."
echo ""
echo "Instructions:"
echo "1. Go to https://console.firebase.google.com"
echo "2. Create a new project (or select existing)"
echo "3. When prompted by the script, select your project"
echo ""

firebase use --add

echo ""
echo "✅ Firebase project configured"
echo ""

# Step 4: Deploy Firestore indexes
echo "Step 4: Deploying Firestore indexes..."
firebase deploy --only firestore:indexes
echo "✅ Firestore indexes deployed"
echo ""

# Step 5: Deploy security rules
echo "Step 5: Deploying Firestore security rules..."
firebase deploy --only firestore:rules
echo "✅ Firestore security rules deployed"
echo ""

# Step 6: Verification
echo "Step 6: Verifying deployment..."
echo ""
echo "✅ Deployment Complete!"
echo ""
echo "Next steps:"
echo "  1. Go to Firebase Console: https://console.firebase.google.com"
echo "  2. Select your project"
echo "  3. Navigate to 'Firestore Database'"
echo "  4. You should see empty collections ready for data"
echo ""
echo "To deploy Cloud Functions later, run:"
echo "  firebase deploy --only functions"
echo ""
