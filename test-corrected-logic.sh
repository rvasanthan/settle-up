#!/bin/bash

# Test the corrected expense splitting logic
# The payer should NOT owe anything

PROJECT_ID="settle-up-161e5"
REGION="us-central1"
EXPENSES_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/expenses"
DASHBOARD_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/dashboard"

echo "🧪 Testing Corrected Expense Splitting Logic"
echo "=============================================="
echo ""

# Test: Alice pays $60 for lunch with Bob and Charlie
echo "📝 Creating Expense:"
echo "   Payer: Alice (user-alice-001)"
echo "   Amount: $60"
echo "   Participants: Bob (user-bob-001), Charlie (user-charlie-001)"
echo "   Expected Split: Bob owes $30, Charlie owes $30, Alice owes $0"
echo ""

EXPENSE_RESPONSE=$(curl -s -X POST "$EXPENSES_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Lunch at Italian restaurant",
    "amount": 60,
    "currency": "USD",
    "createdBy": "user-alice-001",
    "participants": ["user-alice-001", "user-bob-001", "user-charlie-001"],
    "date": "2025-12-30"
  }')

echo "✅ Expense Created:"
echo "$EXPENSE_RESPONSE" | jq .
echo ""

# Check Alice's dashboard (should show she's owed $60)
echo "💰 Alice's Dashboard (She paid, should be owed $60):"
curl -s -X GET "$DASHBOARD_URL?userId=user-alice-001" | jq '.dashboard.summary'
echo ""

# Check Bob's dashboard (should show he owes $30)
echo "💰 Bob's Dashboard (Should owe $30):"
curl -s -X GET "$DASHBOARD_URL?userId=user-bob-001" | jq '.dashboard.summary'
echo ""

# Check Charlie's dashboard (should show he owes $30)
echo "💰 Charlie's Dashboard (Should owe $30):"
curl -s -X GET "$DASHBOARD_URL?userId=user-charlie-001" | jq '.dashboard.summary'
echo ""

echo "✨ Verification Complete!"
echo ""
echo "Expected Results:"
echo "  ✓ Alice: You Are Owed = $60, You Owe = $0"
echo "  ✓ Bob:   You Owe = $30, You Are Owed = $0"
echo "  ✓ Charlie: You Owe = $30, You Are Owed = $0"
