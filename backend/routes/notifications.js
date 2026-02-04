const express = require('express');
const { allQuery, getQuery, runQuery } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendPushNotification } = require('../services/pushNotifications');

const router = express.Router();

// Get all notifications (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const notifications = await allQuery('SELECT * FROM push_notifications ORDER BY sentAt DESC');
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send notification (admin only)
router.post('/send', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, body } = req.body;
    const sentBy = req.user.name || req.user.email;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const notificationId = Date.now().toString();
    const now = new Date().toISOString();

    // Save notification to database
    await runQuery(
      'INSERT INTO push_notifications (id, title, body, sentAt, sentBy) VALUES (?, ?, ?, ?, ?)',
      [notificationId, title, body, now, sentBy]
    );

    // Send push notifications to all registered devices
    const result = await sendPushNotification(title, body);

    res.json({
      id: notificationId,
      title,
      body,
      sentAt: now,
      sentBy,
      pushResult: result,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

