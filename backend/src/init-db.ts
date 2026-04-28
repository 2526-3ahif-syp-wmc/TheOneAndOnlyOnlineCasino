import Database from 'better-sqlite3';

const db = new Database('users.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    coins INTEGER NOT NULL DEFAULT 0
  );
`);

console.log('Users table created successfully.');

db.close();