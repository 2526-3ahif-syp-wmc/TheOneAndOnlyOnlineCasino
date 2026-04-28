import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const db = new Database('users.db');

app.use(cors());
app.use(express.json());

app.get('/', (_, res) => {
  res.send('Backend is running');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});