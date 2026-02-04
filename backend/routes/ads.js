const express = require('express');
const { allQuery, getQuery, runQuery } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all ads
router.get('/', async (req, res) => {
  try {
    const ads = await allQuery('SELECT * FROM advertisements ORDER BY createdAt DESC');
    const formattedAds = ads.map(ad => ({
      ...ad,
      active: ad.active === 1,
    }));
    res.json(formattedAds);
  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active ads
router.get('/active', async (req, res) => {
  try {
    const ads = await allQuery('SELECT * FROM advertisements WHERE active = 1 ORDER BY createdAt DESC');
    const formattedAds = ads.map(ad => ({
      ...ad,
      active: true,
    }));
    res.json(formattedAds);
  } catch (error) {
    console.error('Get active ads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add ad (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { imageUrl, linkUrl, title, active } = req.body;

    if (!imageUrl || !linkUrl || !title) {
      return res.status(400).json({ error: 'Image URL, link URL, and title are required' });
    }

    const adId = Date.now().toString();
    const now = new Date().toISOString();

    await runQuery(
      'INSERT INTO advertisements (id, imageUrl, linkUrl, title, active, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [adId, imageUrl, linkUrl, title, active ? 1 : 0, now]
    );

    const newAd = await getQuery('SELECT * FROM advertisements WHERE id = ?', [adId]);
    res.status(201).json({ ...newAd, active: newAd.active === 1 });
  } catch (error) {
    console.error('Add ad error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete ad (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await runQuery('DELETE FROM advertisements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Advertisement deleted successfully' });
  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

