# Testing Guide

Complete guide for testing the Settle-Up backend.

## Local Testing with Firebase Emulator

### Start Emulator

```bash
cd /Users/vasanth/data/settle-up
firebase emulators:start --only functions,firestore
```

This starts:
- Functions Emulator: `http://localhost:5001`
- Firestore Emulator: `http://localhost:8080`

### Test Script

Create `test.sh` to run test scenarios:

```bash
#!/bin/bash

# Get your project ID from firebase.json or Firebase Console
PROJECT_ID="your-project-id"
REGION="us-central1"
BASE_URL="http://localhost:5001/$PROJECT_ID/$REGION"

# Test 1: Register User 1
echo "=== Test 1: Register User 1 ==="
curl -X POST "$BASE_URL/auth" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user1",
    "email": "user1@example.com",
    "displayName": "John Doe",
    "photoURL": "https://example.com/photo1.jpg"
  }'
echo "\n"

# Test 2: Register User 2
echo "=== Test 2: Register User 2 ==="
curl -X POST "$BASE_URL/auth" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user2",
    "email": "user2@example.com",
    "displayName": "Jane Smith",
    "photoURL": "https://example.com/photo2.jpg"
  }'
echo "\n"

# Test 3: Register User 3
echo "=== Test 3: Register User 3 ==="
curl -X POST "$BASE_URL/auth" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user3",
    "email": "user3@example.com",
    "displayName": "Bob Johnson"
  }'
echo "\n"

# Test 4: Get User Profile
echo "=== Test 4: Get User Profile ==="
curl "$BASE_URL/auth?uid=user1"
echo "\n"

# Test 5: Create Expense (User1 pays for group)
echo "=== Test 5: Create Expense ==="
curl -X POST "$BASE_URL/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Dinner at restaurant",
    "amount": 120,
    "currency": "USD",
    "createdBy": "user1",
    "date": "'$(date -Iseconds)'",
    "participants": [
      {"userId": "user1", "amount": 40},
      {"userId": "user2", "amount": 40},
      {"userId": "user3", "amount": 40}
    ]
  }' | tee expense1.json
echo "\n"

# Test 6: Create Another Expense (User2 pays)
echo "=== Test 6: Create Another Expense ==="
curl -X POST "$BASE_URL/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Movie tickets",
    "amount": 60,
    "currency": "USD",
    "createdBy": "user2",
    "date": "'$(date -Iseconds)'",
    "participants": [
      {"userId": "user1", "amount": 20},
      {"userId": "user2", "amount": 20},
      {"userId": "user3", "amount": 20}
    ]
  }' | tee expense2.json
echo "\n"

# Test 7: Get User1 Dashboard
echo "=== Test 7: Get User1 Dashboard ==="
curl "$BASE_URL/dashboard?userId=user1"
echo "\n"

# Test 8: Get User2 Dashboard
echo "=== Test 8: Get User2 Dashboard ==="
curl "$BASE_URL/dashboard?userId=user2"
echo "\n"

# Test 9: Get User1 Expenses
echo "=== Test 9: Get User1 Expenses ==="
curl "$BASE_URL/expenses?userId=user1"
echo "\n"

# Test 10: Get User3 Expenses
echo "=== Test 10: Get User3 Expenses ==="
curl "$BASE_URL/expenses?userId=user3"
echo "\n"

echo "=== All Tests Complete ==="
```

## Manual Testing Scenarios

### Scenario 1: Simple 50/50 Split
```
User A pays $100 for lunch
Split with User B (50/50)

Expected:
- User A: owes nothing, is owed $50
- User B: owes $50, is owed nothing
- Net Balance A: +$50
- Net Balance B: -$50
```

### Scenario 2: Multiple Expenses
```
Expense 1: User A pays $100, split 3 ways (A, B, C)
Expense 2: User B pays $60, split 2 ways (A, B)

Expected:
- User A: 
  - Owes B: $33.33 (from exp 1)
  - Owes B: $30 (from exp 2) = $63.33 total
  - Is owed C: $33.33 (from exp 1)
  - Net: -$30
```

### Scenario 3: Settlement
```
User A owes User B $50
User A settles payment

Expected:
- Balance marked as settled
- No longer appears in dashboard
```

## Unit Test Commands

```bash
# Run all tests
cd functions
npm test

# Run specific test file
npm test -- api.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Integration Testing Checklist

### User Management
- [ ] Register new user
- [ ] Get user profile
- [ ] User details persist
- [ ] Cannot register duplicate user

### Expense Creation
- [ ] Create expense with valid data
- [ ] Validates amount > 0
- [ ] Validates participant amounts sum correctly
- [ ] Balances created for each participant
- [ ] Expense date stored correctly

### Dashboard
- [ ] Shows all unsettled balances
- [ ] Calculates total amounts correctly
- [ ] Shows who owes what
- [ ] Shows who is owed what
- [ ] Net balance calculated correctly

### Expense Settlement
- [ ] Can settle expense as payer
- [ ] Cannot settle as non-payer (403)
- [ ] Settled expense no longer in dashboard
- [ ] Settled status persists

### Expense Deletion
- [ ] Creator can delete expense
- [ ] Non-creator cannot delete (403)
- [ ] Associated balances deleted
- [ ] Expense no longer in queries

### Security
- [ ] Users can only see their data
- [ ] Cannot read other user's expenses
- [ ] Cannot delete other user's expenses
- [ ] Only participants can access expense

## Performance Testing

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 "http://localhost:5001/$PROJECT/us-central1/dashboard?userId=user1"

# Using hey
go install github.com/rakyll/hey@latest
hey -n 1000 -c 10 "http://localhost:5001/$PROJECT/us-central1/dashboard?userId=user1"
```

### Expected Results
- Response time: <500ms per request
- Error rate: <1%
- Throughput: >20 req/sec

## Error Case Testing

### Invalid Input
```bash
# Missing required fields
curl -X POST "http://localhost:5001/$PROJECT/us-central1/auth" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
# Expected: 400 Bad Request

# Invalid amount
curl -X POST "http://localhost:5001/$PROJECT/us-central1/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test",
    "amount": -50,
    "currency": "USD",
    "createdBy": "user1",
    "participants": [{"userId": "user1", "amount": -50}]
  }'
# Expected: 400 Bad Request
```

### Authorization
```bash
# User A tries to delete User B's expense
curl -X DELETE "http://localhost:5001/$PROJECT/us-central1/expenses?expenseId=abc&userId=user_a"
# Expected: 403 Forbidden if User A didn't create expense
```

### Not Found
```bash
# Query non-existent user
curl "http://localhost:5001/$PROJECT/us-central1/auth?uid=nonexistent"
# Expected: 404 Not Found
```

## Browser Testing

### 1. Setup Test Frontend

Create simple HTML test page:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Settle-Up Test</title>
  <script src="client/SettleUpClient.js"></script>
</head>
<body>
  <h1>Settle-Up Test Console</h1>
  
  <button onclick="testRegister()">Register User</button>
  <button onclick="testCreateExpense()">Create Expense</button>
  <button onclick="testDashboard()">Get Dashboard</button>
  
  <pre id="output"></pre>
  
  <script>
    const client = new SettleUpClient(
      {
        projectId: 'test-project'
      },
      // Pass your Google Auth instance here
    );
    
    async function testRegister() {
      // Implementation
    }
    
    async function testCreateExpense() {
      // Implementation
    }
    
    async function testDashboard() {
      // Implementation
    }
  </script>
</body>
</html>
```

### 2. Check Browser Console
- Look for network requests
- Check response payloads
- Verify CORS headers
- Test error handling

## Debugging Tips

### View Firestore Data
```bash
# Open Firestore emulator UI
open http://localhost:8080
```

### View Cloud Function Logs
```bash
firebase functions:log
```

### Enable Verbose Logging
```javascript
// In your function handlers
console.log('User ID:', userId);
console.log('Expense data:', expenseData);
console.error('Error details:', error);
```

### Test with Different Timezones
```bash
# Override timezone for testing
TZ=America/New_York npm test
```

## Regression Testing Checklist

Before each deployment:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Performance benchmarks acceptable
- [ ] Security rules still enforced
- [ ] Error handling works
- [ ] Authentication flows work
- [ ] CORS properly configured
- [ ] Database indexes created
- [ ] Backup/restore tested
- [ ] Monitoring alerts configured

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd functions && npm install
      - run: cd functions && npm test
```

## Test Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Functions | 90%+ | - |
| Routes | 95%+ | - |
| Utils | 90%+ | - |
| Overall | 90%+ | - |

## Known Issues & Limitations

- Emulator doesn't perfectly match production
- Cold start latency not visible in emulator
- Some auth flows only work with real Firebase
- Real-time updates not fully testable in emulator

## Next Steps

1. Run emulator: `firebase emulators:start`
2. Execute test script: `bash test.sh`
3. Check Firestore data at `localhost:8080`
4. Monitor logs: `firebase functions:log`
5. Fix any issues
6. Deploy when ready: `firebase deploy`
