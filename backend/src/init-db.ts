import Database from 'better-sqlite3';

const db = new Database('users.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    premium INTEGER NOT NULL DEFAULT 0,
    coins INTEGER NOT NULL DEFAULT 1000,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS game_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_type TEXT NOT NULL,
    result TEXT NOT NULL,
    coins_change INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Add premium column if it doesn't exist
try {
  db.exec(`ALTER TABLE users ADD COLUMN premium INTEGER NOT NULL DEFAULT 0;`);
} catch (error) {
  // Column might already exist, ignore error
}

console.log('Database tables created successfully.');
console.log('Database tables created/updated successfully.');

db.close();