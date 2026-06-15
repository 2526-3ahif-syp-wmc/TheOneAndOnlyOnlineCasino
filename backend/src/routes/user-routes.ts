import { Router } from 'express';
import {
  createUser,
  findUserByLogin,
  getProfileUserById,
  getPublicUsers,
  searchPublicUsers,
  updateCoins,
  updatePremium,
  updateProfile,
  updateXp,
  usernameExists,
  usernameExistsForOtherUser
} from '../services/user-service';

export const authRouter = Router();

authRouter.get('/users/public', (req, res) => {
  const excludeUserId = Number(req.query.excludeUserId);
  const query = String(req.query.query ?? '').trim();

  if (query.length > 0) {
    return res.json(searchPublicUsers(query, Number.isInteger(excludeUserId) ? excludeUserId : undefined));
  }

  return res.json(getPublicUsers(Number.isInteger(excludeUserId) ? excludeUserId : undefined));
});

// REGISTER
authRouter.post('/users', (req, res) => {
  const { username, password, coins } = req.body;

  if (usernameExists(username)) {
    return res.status(409).json({
      message: 'Username already exists'
    });
  }

  const newUser = createUser(username, password, coins ?? 1000);

  return res.status(201).json(newUser);
});

// LOG IN
authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = findUserByLogin(username, password);

  if (!user) {
    return res.status(401).json({
      message: 'Invalid username or password'
    });
  }

  return res.json(user);
});

// UPDATE COINS
authRouter.patch('/users/:id/coins', (req, res) => {
  const userId = Number(req.params.id);
  const { coins } = req.body;

  const updatedUser = updateCoins(userId, coins);

  if (!updatedUser) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  return res.json(updatedUser);
});

// UPDATE XP
authRouter.patch('/users/:id/xp', (req, res) => {
  const userId = Number(req.params.id);
  const { xp } = req.body;

  const updatedUser = updateXp(userId, xp);

  if (!updatedUser) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  return res.json(updatedUser);
});

// UPDATE PROFILE
authRouter.patch('/users/:id', (req, res) => {
  const userId = Number(req.params.id);
  const { username, currentPassword, newPassword } = req.body;

  const user = getProfileUserById(userId);

  if (!user) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  if (user.password !== currentPassword) {
    return res.status(401).json({
      message: 'Current password is incorrect'
    });
  }

  if (username !== user.username && usernameExistsForOtherUser(username, userId)) {
    return res.status(409).json({
      message: 'Username already exists'
    });
  }

  const passwordToSave =
    newPassword && newPassword.length > 0 ? newPassword : user.password;

  const updatedUser = updateProfile(userId, username, passwordToSave);

  return res.json(updatedUser);
});

// PREMIUM
authRouter.patch('/users/:id/premium', (req, res) => {
  const userId = Number(req.params.id);
  const { premium } = req.body;

  const updatedUser = updatePremium(userId, premium);

  if (!updatedUser) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  return res.json(updatedUser);
});