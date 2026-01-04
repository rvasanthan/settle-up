const admin = require('firebase-admin');
const authMiddleware = require('../utils/auth');

const db = admin.firestore();

/**
 * Register a new user with Google ID
 * POST /auth
 * Body: { uid, email, displayName, photoURL (optional) }
 */
async function registerUser(req, res) {
  try {
    const { uid, email, displayName, photoURL } = req.body;

    // Validate required fields
    if (!uid || !email || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: uid, email, displayName'
      });
    }

    // CHECK ALLOWLIST FIRST
    // Only allow users whose email is present in 'allowed_users' collection
    const allowedDoc = await db.collection('allowed_users').doc(email).get();
    if (!allowedDoc.exists) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to access this app. Please reach out to the administration team.'
      });
    }

    // Check if user already exists
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      // Update existing user login time or details if needed
      return res.status(200).json({
        success: true,
        message: 'User logged in',
        user: userDoc.data()
      });
    }

    // Create user document
    const userData = {
      uid,
      email,
      displayName,
      photoURL: photoURL || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(uid).set(userData);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get user profile
 * GET /auth?uid=userId
 */
async function getUser(req, res) {
  try {
    const { uid } = req.query;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: 'User ID (uid) is required'
      });
    }

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: userDoc.data()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Update user profile
 * PUT /auth
 * Body: { uid, phoneNumber, ... }
 */
async function updateUser(req, res) {
  try {
    const { uid, phoneNumber } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: 'User ID (uid) is required'
      });
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const updates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (phoneNumber) updates.phoneNumber = phoneNumber;

    await userRef.update(updates);

    // Return updated user
    const updatedDoc = await userRef.get();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedDoc.data()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Search users by displayName or email
 * GET /searchUsers?q=query
 */
async function searchUsers(req, res) {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const users = [];
    const queryLower = q.toLowerCase();

    // 1. Search by Email (Exact match)
    const emailSnapshot = await db.collection('users')
      .where('email', '==', q)
      .get();

    emailSnapshot.forEach(doc => {
      users.push(doc.data());
    });

    // 2. Search by Display Name (Prefix match)
    // Note: This is case-sensitive in Firestore. 
    // For a real app, we'd store a lowercase version of the name.
    // We'll try exact case match for now, or maybe just rely on client side filtering if list is small?
    // No, list can be large.
    // Let's try the standard prefix hack.
    const nameSnapshot = await db.collection('users')
      .where('displayName', '>=', q)
      .where('displayName', '<=', q + '\uf8ff')
      .limit(10)
      .get();

    nameSnapshot.forEach(doc => {
      // Avoid duplicates
      if (!users.find(u => u.uid === doc.id)) {
        users.push(doc.data());
      }
    });

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = { registerUser, getUser, searchUsers, updateUser };
