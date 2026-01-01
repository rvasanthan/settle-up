# 🎉 Settle-Up Frontend Setup Guide

Your complete React frontend is ready to use!

## 📋 What's Included

✅ **4 Main Components:**
- `Auth.js` - Login with Google or test accounts
- `Dashboard.js` - Real-time balance tracking
- `ExpenseForm.js` - Create and split expenses  
- `ExpenseList.js` - View all expenses

✅ **Beautiful Styling:**
- Responsive design (mobile, tablet, desktop)
- Gradient purple theme
- Smooth animations & transitions
- Dark mode ready

✅ **Full Features:**
- User authentication
- Expense creation with automatic splitting
- Real-time balance updates
- Delete expenses
- View expense history

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Start Development Server
```bash
npm start
```

The app opens at `http://localhost:3000`

### Step 3: Test the App
1. Click "Sign in with Google" or "Create Test Account"
2. Enter any name and email
3. Create multiple accounts
4. Add expenses from the "Add Expense" tab
5. Watch balances update on the Dashboard

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html              # Main HTML file
├── src/
│   ├── components/
│   │   ├── Auth.js             # Login page
│   │   ├── Dashboard.js        # Balance summary
│   │   ├── ExpenseForm.js      # Add expenses
│   │   └── ExpenseList.js      # View expenses
│   ├── styles/
│   │   ├── Auth.css
│   │   ├── Dashboard.css
│   │   ├── ExpenseForm.css
│   │   └── ExpenseList.css
│   ├── utils/
│   │   └── dateUtils.js        # Helper functions
│   ├── App.js                  # Main app component
│   ├── App.css                 # App styling
│   ├── index.js                # React entry point
│   └── index.css               # Global styles
├── package.json
└── README.md
```

## 🔗 API Endpoints Used

The frontend connects to these Cloud Functions:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth` | POST | Register/login user |
| `/dashboard` | GET | Get user's balance summary |
| `/expenses` | POST | Create expense |
| `/expenses` | GET | List user's expenses |
| `/expenses` | DELETE | Delete expense |
| `/settleExpense` | POST | Mark expense as settled |

## 🎨 Customization

### Change Colors
Edit `frontend/src/App.css` and component CSS files:
```css
/* Current theme */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Change to your colors */
background: linear-gradient(135deg, #YOUR_COLOR1, #YOUR_COLOR2);
```

### Change API Base URL
Edit `frontend/src/App.js`:
```javascript
const API_BASE = 'https://your-new-api-url.com';
```

## 📱 Mobile-Friendly

The app is fully responsive:
- ✅ Mobile phones (320px+)
- ✅ Tablets (768px+)
- ✅ Desktops (1200px+)

## 🧪 Testing

Create test data with the script:
```bash
bash test-api.sh
```

This creates sample users and expenses.

## 📦 Production Build

Create an optimized production build:
```bash
npm run build
```

Output will be in the `build/` folder.

## 🚀 Deployment Options

### Option 1: Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Option 2: Vercel
```bash
vercel
```

### Option 3: Netlify
```bash
npm run build
# Deploy the 'build' folder to Netlify
```

## ⚙️ Environment Variables

Create `.env` file in frontend folder (optional):
```
REACT_APP_API_BASE=https://us-central1-settle-up-161e5.cloudfunctions.net
REACT_APP_ENV=production
```

## 🐛 Troubleshooting

**CORS Errors?**
- Backend Cloud Functions have CORS enabled
- Make sure API base URL matches your Firebase project

**Expenses not showing?**
- Dashboard auto-refreshes every 5 seconds
- Check browser console for API errors
- Verify Firebase project has data

**Localhost not working?**
- Ensure port 3000 is available: `lsof -i :3000`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall

## 📚 Next Steps

1. ✅ Frontend setup complete
2. Deploy to Vercel or Firebase Hosting
3. Connect your own domain
4. Enable production analytics
5. Add real Google authentication
6. Deploy Mobile app (React Native)

## 💡 Tips

- Save user data to localStorage (already implemented)
- Add expense categories for better organization
- Implement push notifications for payments
- Add expense splitting by custom amounts
- Create expense groups (trips, shared homes, etc.)

## 🆘 Help

Frontend README: `frontend/README.md`
Backend README: `functions/README.md`
API Docs: `API_FLOWS.md`
Deployment Guide: `DEPLOYMENT.md`

---

**You're all set!** 🚀

Start the dev server and start splitting expenses! 💰
