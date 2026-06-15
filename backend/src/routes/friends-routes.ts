import { Router } from 'express';
import {
  addFriend,
  getFriendsByUserId,
  removeFriend
} from '../services/friends-service';
import { findPublicUserByUsername } from '../services/user-service';

export const friendsRouter = Router();

friendsRouter.get('/', (req, res) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  return res.json(getFriendsByUserId(userId));
});

friendsRouter.post('/', (req, res) => {
  const { userId, username } = req.body;

  if (!userId || !username) {
    return res.status(400).json({ message: 'userId and username are required' });
  }

  const normalizedUsername = String(username).trim();
  const matchedUser = findPublicUserByUsername(normalizedUsername);

  if (!matchedUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const friend = addFriend(Number(userId), normalizedUsername);

  if (!friend) {
    return res.status(409).json({ message: 'Friend already exists' });
  }

  return res.status(201).json(friend);
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
