import './init-db';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/user-routes';
import { leaderboardRouter } from './routes/leaderboard-routes';
import { friendsRouter } from './routes/friends-routes';
import { getPublicUsers } from './services/user-service';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/leaderboard', leaderboardRouter);
app.use('/friends', friendsRouter);

app.get('/', (_, res) => {
  return res.json('Backend is running!');
});

app.get('/users', (_, res) => {
  const users = getPublicUsers();

  return res.json(users);
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});