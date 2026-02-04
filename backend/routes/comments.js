const express = require('express');
const { allQuery, runQuery, getQuery } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get comments for a post
router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await allQuery(
      'SELECT * FROM comments WHERE postId = ? ORDER BY createdAt DESC',
      [req.params.postId]
    );
    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { postId, text } = req.body;
    const userId = req.user.id;

    if (!postId || !text) {
      return res.status(400).json({ error: 'Post ID and text are required' });
    }

    // Get user info
    const user = await getQuery('SELECT name, avatar FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if post exists
    const post = await getQuery('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const commentId = Date.now().toString();
    const now = new Date().toISOString();

    await runQuery(
      'INSERT INTO comments (id, postId, userId, userName, userAvatar, text, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [commentId, postId, userId, user.name, user.avatar || null, text, now]
    );

    // Update post comments count
    await runQuery('UPDATE posts SET commentsCount = commentsCount + 1 WHERE id = ?', [postId]);

    const newComment = await getQuery('SELECT * FROM comments WHERE id = ?', [commentId]);
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

