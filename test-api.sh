#!/bin/bash

# Test API endpoints for settle-up Firebase backend
# This script creates sample data in Firestore

PROJECT_ID="settle-up-161e5"
REGION="us-central1"

# Function URLs
AUTH_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/auth"
EXPENSES_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/expenses"
DASHBOARD_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/dashboard"
SETTLE_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/settleExpense"

echo "🚀 Testing Settle-Up API"
echo "========================"
echo ""

# Test 1: Register User 1
echo "1️⃣ Registering User 1 (Alice)..."
USER1_RESPONSE=$(curl -s -X POST "$AUTH_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user-alice-001",
    "email": "alice@example.com",
    "displayName": "Alice",
    "photoURL": "https://example.com/alice.jpg"
  }')

echo "Response: $USER1_RESPONSE"
echo ""

# Test 2: Register User 2
echo "2️⃣ Registering User 2 (Bob)..."
USER2_RESPONSE=$(curl -s -X POST "$AUTH_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user-bob-001",
    "email": "bob@example.com",
    "displayName": "Bob",
    "photoURL": "https://example.com/bob.jpg"
  }')

echo "Response: $USER2_RESPONSE"
echo ""

# Test 3: Create an expense (Alice paid $60 for lunch, Bob owes $30)
echo "3️⃣ Creating Expense (Alice paid for lunch)..."
EXPENSE_RESPONSE=$(curl -s -X POST "$EXPENSES_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Lunch at restaurant",
    "amount": 60,
    "currency": "USD",
    "createdBy": "user-alice-001",
    "participants": ["user-alice-001", "user-bob-001"],
    "date": "2025-12-30"
  }')

echo "Response: $EXPENSE_RESPONSE"
EXPENSE_ID=$(echo "$EXPENSE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Expense ID: $EXPENSE_ID"
echo ""

# Test 4: Get Alice's dashboard
echo "4️⃣ Getting Alice's Dashboard..."
curl -s -X GET "$DASHBOARD_URL?userId=user-alice-001" \
  -H "Content-Type: application/json" | jq . || echo "Response received"
echo ""

# Test 5: Get Bob's dashboard
echo "5️⃣ Getting Bob's Dashboard..."
curl -s -X GET "$DASHBOARD_URL?userId=user-bob-001" \
  -H "Content-Type: application/json" | jq . || echo "Response received"
echo ""

echo "✅ Test complete!"
echo ""
echo "📊 You should now see collections in Firestore:"
echo "   - users (with Alice and Bob)"
echo "   - expenses (with the lunch expense)"
echo "   - balances (Bob owes Alice $30)"
