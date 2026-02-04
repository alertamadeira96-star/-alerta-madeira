const express = require('express');
const { allQuery, getQuery, runQuery } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await allQuery(`
      SELECT p.*,
        GROUP_CONCAT(DISTINCT CASE WHEN r.reactionType = 'thumbsUp' THEN r.userId END) as thumbsUp,
        GROUP_CONCAT(DISTINCT CASE WHEN r.reactionType = 'heart' THEN r.userId END) as heart,
        GROUP_CONCAT(DISTINCT CASE WHEN r.reactionType = 'alert' THEN r.userId END) as alert
      FROM posts p
      LEFT JOIN reactions r ON p.id = r.postId
      GROUP BY p.id
      ORDER BY p.createdAt DESC
    `);

    // Format reactions
    const formattedPosts = posts.map(post => ({
      ...post,
      reactions: {
        thumbsUp: post.thumbsUp ? post.thumbsUp.split(',') : [],
        heart: post.heart ? post.heart.split(',') : [],
        alert: post.alert ? post.alert.split(',') : [],
      },
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await getQuery('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get reactions
    const reactions = await allQuery('SELECT * FROM reactions WHERE postId = ?', [req.params.id]);
    const formattedReactions = {
      thumbsUp: reactions.filter(r => r.reactionType === 'thumbsUp').map(r => r.userId),
      heart: reactions.filter(r => r.reactionType === 'heart').map(r => r.userId),
      alert: reactions.filter(r => r.reactionType === 'alert').map(r => r.userId),
    };

    res.json({ ...post, reactions: formattedReactions });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, imageUrl, videoUrl, category, location, latitude, longitude } = req.body;
    const userId = req.user.id;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    // Get user info
    const user = await getQuery('SELECT name, avatar FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const postId = Date.now().toString();
    const now = new Date().toISOString();

    await runQuery(
      'INSERT INTO posts (id, userId, userName, userAvatar, title, description, imageUrl, videoUrl, category, location, latitude, longitude, createdAt, commentsCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [postId, userId, user.name, user.avatar || null, title, description, imageUrl || null, videoUrl || null, category, location || null, latitude || null, longitude || null, now, 0]
    );

    const newPost = await getQuery('SELECT * FROM posts WHERE id = ?', [postId]);
    res.status(201).json({ ...newPost, reactions: { thumbsUp: [], heart: [], alert: [] } });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Check if post exists and user owns it or is admin
    const post = await getQuery('SELECT userId FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    // Delete reactions and comments
    await runQuery('DELETE FROM reactions WHERE postId = ?', [postId]);
    await runQuery('DELETE FROM comments WHERE postId = ?', [postId]);
    await runQuery('DELETE FROM posts WHERE id = ?', [postId]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle reaction
router.post('/:id/reactions', authenticateToken, async (req, res) => {
  try {
    const { reactionType } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;

    if (!['thumbsUp', 'heart', 'alert'].includes(reactionType)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    // Check if reaction exists
    const existing = await getQuery(
      'SELECT * FROM reactions WHERE postId = ? AND userId = ? AND reactionType = ?',
      [postId, userId, reactionType]
    );

    if (existing) {
      // Remove reaction
      await runQuery('DELETE FROM reactions WHERE id = ?', [existing.id]);
    } else {
      // Add reaction
      const reactionId = Date.now().toString();
      const now = new Date().toISOString();
      await runQuery(
        'INSERT INTO reactions (id, postId, userId, reactionType, createdAt) VALUES (?, ?, ?, ?, ?)',
        [reactionId, postId, userId, reactionType, now]
      );
    }

    // Get updated reactions
    const reactions = await allQuery('SELECT * FROM reactions WHERE postId = ?', [postId]);
    const formattedReactions = {
      thumbsUp: reactions.filter(r => r.reactionType === 'thumbsUp').map(r => r.userId),
      heart: reactions.filter(r => r.reactionType === 'heart').map(r => r.userId),
      alert: reactions.filter(r => r.reactionType === 'alert').map(r => r.userId),
    };

    res.json({ reactions: formattedReactions });
  } catch (error) {
    console.error('Toggle reaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

