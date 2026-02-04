const express = require('express');
const { getQuery, runQuery } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register push token
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { token, platform } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    // Check if token already exists
    const existing = await getQuery('SELECT * FROM push_tokens WHERE token = ?', [token]);
    
    if (existing) {
      // Update existing token
      await runQuery('UPDATE push_tokens SET userId = ?, platform = ? WHERE token = ?', [userId, platform || null, token]);
      res.json({ message: 'Push token updated' });
    } else {
      // Create new token
      const tokenId = Date.now().toString();
      const now = new Date().toISOString();
      await runQuery(
        'INSERT INTO push_tokens (id, userId, token, platform, createdAt) VALUES (?, ?, ?, ?, ?)',
        [tokenId, userId, token, platform || null, now]
      );
      res.json({ message: 'Push token registered' });
    }
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

