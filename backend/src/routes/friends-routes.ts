import { Router } from 'express';
import {
  declineFriendRequest,
  getFriendsByUserId,
  removeFriend,
  acceptFriendRequest,
  getFriendRequests,
  sendFriendRequest
} from '../services/friends-service';

export const friendsRouter = Router();

friendsRouter.get('/', (req, res) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  return res.json(getFriendsByUserId(userId));
});

friendsRouter.delete('/:id', (req, res) => {
  const userId = Number(req.query.userId);
  const friendId = Number(req.params.id);

  if (!userId || !friendId) {
    return res.status(400).json({ message: 'userId and id are required' });
  }

  const deleted = removeFriend(userId, friendId);

  if (!deleted) {
    return res.status(404).json({ message: 'Friend not found' });
  }

  return res.status(204).send();
});

friendsRouter.post('/requests', (req, res) => {
  const userId = Number(req.body.userId);
  const username = String(req.body.username ?? '').trim();

  if (!userId || !username) {
    return res.status(400).json({ message: 'userId and username are required' });
  }

  try {
    const result = sendFriendRequest(userId, username);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: 'Request could not be sent.' });
  }
});

friendsRouter.get('/requests/:userId', (req, res) => {
  const userId = Number(req.params.userId);

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  return res.json(getFriendRequests(userId));
});

friendsRouter.post('/requests/:requestId/accept', (req, res) => {
  const requestId = Number(req.params.requestId);

  if (!requestId) {
    return res.status(400).json({ message: 'requestId is required' });
  }

  try {
    const result = acceptFriendRequest(requestId);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: 'Request could not be accepted.' });
  }
});

friendsRouter.post('/requests/:requestId/decline', (req, res) => {
  const requestId = Number(req.params.requestId);

  if (!requestId) {
    return res.status(400).json({ message: 'requestId is required' });
  }

  try {
    const result = declineFriendRequest(requestId);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: 'Request could not be declined.' });
  }
});