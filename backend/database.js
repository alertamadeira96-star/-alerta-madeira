const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    role TEXT DEFAULT 'user',
    createdAt TEXT NOT NULL
  )`, (err) => {
    if (err) console.error('Error creating users table:', err);
  });

  // Posts table
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    userName TEXT NOT NULL,
    userAvatar TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    imageUrl TEXT,
    videoUrl TEXT,
    category TEXT NOT NULL,
    location TEXT,
    latitude REAL,
    longitude REAL,
    createdAt TEXT NOT NULL,
    commentsCount INTEGER DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`, (err) => {
    if (err) console.error('Error creating posts table:', err);
  });

  // Reactions table
  db.run(`CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    postId TEXT NOT NULL,
    userId TEXT NOT NULL,
    reactionType TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (postId) REFERENCES posts(id),
    FOREIGN KEY (userId) REFERENCES users(id),
    UNIQUE(postId, userId, reactionType)
  )`, (err) => {
    if (err) console.error('Error creating reactions table:', err);
  });

  // Comments table
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    postId TEXT NOT NULL,
    userId TEXT NOT NULL,
    userName TEXT NOT NULL,
    userAvatar TEXT,
    text TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (postId) REFERENCES posts(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  )`, (err) => {
    if (err) console.error('Error creating comments table:', err);
  });

  // Advertisements table
  db.run(`CREATE TABLE IF NOT EXISTS advertisements (
    id TEXT PRIMARY KEY,
    imageUrl TEXT NOT NULL,
    linkUrl TEXT NOT NULL,
    title TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    createdAt TEXT NOT NULL
  )`, (err) => {
    if (err) console.error('Error creating advertisements table:', err);
  });

  // Push notifications table
  db.run(`CREATE TABLE IF NOT EXISTS push_notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sentAt TEXT NOT NULL,
    sentBy TEXT NOT NULL
  )`, (err) => {
    if (err) console.error('Error creating push_notifications table:', err);
  });

  // Push tokens table
  db.run(`CREATE TABLE IF NOT EXISTS push_tokens (
    id TEXT PRIMARY KEY,
    userId TEXT,
    token TEXT UNIQUE NOT NULL,
    platform TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`, (err) => {
    if (err) console.error('Error creating push_tokens table:', err);
  });

  // Create default admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@alertamadeira.pt';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
    if (err) {
      console.error('Error checking admin user:', err);
      return;
    }
    
    if (!row) {
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      const adminId = 'admin';
      const now = new Date().toISOString();
      
      db.run(
        'INSERT INTO users (id, email, password, name, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [adminId, adminEmail, hashedPassword, 'Administrador', 'admin', now],
        (err) => {
          if (err) {
            console.error('Error creating admin user:', err);
          } else {
            console.log('Default admin user created');
          }
        }
      );
    }
  });
}

// Helper functions
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = { db, runQuery, getQuery, allQuery };

