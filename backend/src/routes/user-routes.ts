import { Router } from "express";
import * as fs from "fs";
import * as path from "path";

import {
  createUser,
  findUserByLogin,
  getProfileUserById,
  updateCoins,
  updatePremium,
  updateProfile,
  updateXp,
  usernameExists,
  usernameExistsForOtherUser,
} from "../services/user-service";
import { db } from "../databases/db";


type PublicUserRow = {
  id: number;
  username: string;
  coins: number;
  premium: number;
  wins: number;
  losses: number;
  xp: number;
};

const AVATARS_DIR = path.join(__dirname, "..", "public", "avatars");
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });}

function getPublicUsers(excludeUserId?: number): PublicUserRow[] {
  const query = `
    SELECT id, username, coins, premium, wins, losses, xp
    FROM users
    ${Number.isInteger(excludeUserId) ? "WHERE id != ?" : ""}
    ORDER BY username COLLATE NOCASE ASC
  `;

  return Number.isInteger(excludeUserId)
    ? (db.prepare(query).all(excludeUserId) as PublicUserRow[])
    : (db.prepare(query).all() as PublicUserRow[]);
}

function searchPublicUsers(queryText: string, excludeUserId?: number): PublicUserRow[] {
  const searchText = `%${queryText.trim()}%`;
  const query = `
    SELECT id, username, coins, premium, wins, losses, xp
    FROM users
    WHERE username LIKE ? COLLATE NOCASE
    ${Number.isInteger(excludeUserId) ? "AND id != ?" : ""}
    ORDER BY username COLLATE NOCASE ASC
  `;

  return Number.isInteger(excludeUserId)
    ? (db.prepare(query).all(searchText, excludeUserId) as PublicUserRow[])
    : (db.prepare(query).all(searchText) as PublicUserRow[]);
}

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
authRouter.post("/users", (req, res) => {
  const { username, password, coins } = req.body;

  if (usernameExists(username)) {
    return res.status(409).json({
      message: "Username already exists",
    });
  }

  const newUser = createUser(username, password, coins ?? 1000);

  return res.status(201).json(newUser);
});

// LOG IN
authRouter.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = findUserByLogin(username, password);

  if (!user) {
    return res.status(401).json({
      message: "Invalid username or password",
    });
  }

  return res.json(user);
});

// UPDATE COINS
authRouter.patch("/users/:id/coins", (req, res) => {
  const userId = Number(req.params.id);
  const { coins } = req.body;

  const updatedUser = updateCoins(userId, coins);

  if (!updatedUser) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  return res.json(updatedUser);
});

// UPDATE XP
authRouter.patch("/users/:id/xp", (req, res) => {
  const userId = Number(req.params.id);
  const { xp } = req.body;

  const updatedUser = updateXp(userId, xp);

  if (!updatedUser) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  return res.json(updatedUser);
});

// UPDATE PROFILE
authRouter.patch("/users/:id", (req, res) => {
  const userId = Number(req.params.id);
  const { username, currentPassword, newPassword } = req.body;

  const user = getProfileUserById(userId);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  if (user.password !== currentPassword) {
    return res.status(401).json({
      message: "Current password is incorrect",
    });
  }

  if (
    username !== user.username &&
    usernameExistsForOtherUser(username, userId)
  ) {
    return res.status(409).json({
      message: "Username already exists",
    });
  }

  const passwordToSave =
    newPassword && newPassword.length > 0 ? newPassword : user.password;

  const updatedUser = updateProfile(userId, username, passwordToSave);

  return res.json(updatedUser);
});

// PREMIUM
authRouter.patch("/users/:id/premium", (req, res) => {
  const userId = Number(req.params.id);
  const { premium } = req.body;

  const updatedUser = updatePremium(userId, premium);

  if (!updatedUser) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  return res.json(updatedUser);
});

// UPLOAD AVATAR
authRouter.patch("/users/:id/avatar", (req, res) => {
  const userId = Number(req.params.id);
  const { avatar_base64 } = req.body;

  if (!avatar_base64) {
    return res.status(400).json({ message: "No image data provided." });
  }

  // Strip the data:image/...;base64, prefix
  const matches = avatar_base64.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ message: "Invalid image format." });
  }

  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const imageData = Buffer.from(matches[2], "base64");

  // Guard: 5 MB max
  if (imageData.byteLength > 5 * 1024 * 1024) {
    return res.status(413).json({ message: "Image must be under 5 MB." });
  }

  // Delete old avatar file if one exists
  const existing = db
    .prepare("SELECT avatar_url FROM users WHERE id = ?")
    .get(userId) as { avatar_url: string | null } | undefined;

  if (existing?.avatar_url) {
    const oldPath = path.join(__dirname, "..", "public", existing.avatar_url);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  // Save new file: avatars/<userId>.<ext>
  const filename = `${userId}.${ext}`;
  const filepath = path.join(AVATARS_DIR, filename);
  fs.writeFileSync(filepath, imageData);

  const avatarUrl = `/avatars/${filename}`;

  const result = db
    .prepare("UPDATE users SET avatar_url = ? WHERE id = ?")
    .run(avatarUrl, userId);

  if (result.changes === 0) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({ avatar_url: avatarUrl });
});


// UPLOAD AVATAR
authRouter.patch("/users/:id/avatar", (req, res) => {
  const userId = Number(req.params.id);
  const { avatar_base64 } = req.body;

  if (!avatar_base64) {
    return res.status(400).json({ message: "No image data provided." });
  }

  const matches = avatar_base64.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ message: "Invalid image format." });
  }

  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const imageData = Buffer.from(matches[2], "base64");

  if (imageData.byteLength > 5 * 1024 * 1024) {
    return res.status(413).json({ message: "Image must be under 5 MB." });
  }

  // Delete old avatar file if one exists
  const existing = db
    .prepare("SELECT avatar_url FROM users WHERE id = ?")
    .get(userId) as { avatar_url: string | null } | undefined;

  if (existing?.avatar_url) {
    const oldPath = path.join(__dirname, "..", "public", existing.avatar_url);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const AVATARS_DIR = path.join(__dirname, "..", "public", "avatars");
  if (!fs.existsSync(AVATARS_DIR)) fs.mkdirSync(AVATARS_DIR, { recursive: true });
  const filename = `${userId}.${ext}`;
  const filepath = path.join(AVATARS_DIR, filename);
  fs.writeFileSync(filepath, imageData);

  const avatarUrl = `/avatars/${filename}`;

  const result = db
    .prepare("UPDATE users SET avatar_url = ? WHERE id = ?")
    .run(avatarUrl, userId);

  if (result.changes === 0) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({ avatar_url: avatarUrl });
});

