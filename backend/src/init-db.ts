import Database from 'better-sqlite3';

const db = new Database('users.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    coins INTEGER NOT NULL DEFAULT 1000
  );
`);

// Add premium column if it doesn't exist
try {
  db.exec(`ALTER TABLE users ADD COLUMN premium INTEGER NOT NULL DEFAULT 0;`);
} catch (error) {
  // Column might already exist, ignore error
}

console.log('Users table created/updated successfully.');

db.close();