import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth-routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);

app.get('/', (_, res) => {
  res.send('Backend is running');
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});