# Settle-Up Frontend

React frontend for the Settle-Up expense splitting application.

## Features

- 🔐 User authentication (Google Sign-In or test accounts)
- 💰 Dashboard showing balance summaries
- 📝 Create and manage expenses
- 👥 Split expenses among multiple people
- 📊 Real-time balance tracking
- 📱 Fully responsive design

## Installation

```bash
cd frontend
npm install
```

## Running Locally

```bash
npm start
```

The app will open at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

## Components

- **Auth** - Login/Registration page
- **Dashboard** - Balance summary and transaction overview
- **ExpenseForm** - Create new expenses
- **ExpenseList** - View all your expenses

## API Integration

The frontend connects to your Firebase Cloud Functions at:
```
https://us-central1-settle-up-161e5.cloudfunctions.net
```

## Testing

1. Create test accounts using the "Create Test Account" button
2. Add expenses by navigating to the "Add Expense" tab
3. View balances in the Dashboard tab

## Environment Variables

Create a `.env` file if needed:
```
REACT_APP_API_BASE=https://us-central1-settle-up-161e5.cloudfunctions.net
```

## Deployment

Deploy to Firebase Hosting:
```bash
npm run build
firebase deploy --only hosting
```

Or deploy to Vercel:
```bash
vercel
```
