import { Router } from "express";
import { hit, stand, startGame, getBlackjackGameById } from "../services/blackjack-service";

export const blackjackRouter = Router();

blackjackRouter.post("/", (req, res) => {
  const userId = Number(req.body.userId);
  const bet = Number(req.body.bet);

  if (!Number.isInteger(userId)) {
    return res.status(400).json({
      message: "Valid userId is required",
    });
  }

  if (!Number.isInteger(bet) || bet <= 0) {
    return res.status(400).json({
      message: "Valid bet is required",
    });
  }

  try {
    const game = startGame(userId, bet);

    if (!game) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(201).location(`/blackjack/${game.id}`).json(game);
  } catch (error) {
    return res.status(500).json({
      message: "Could not start blackjack game",
    });
  } finally {
  }
});

blackjackRouter.post("/:id/hit", (req, res) => {
  const gameId = Number(req.params.id);

  if (!Number.isInteger(gameId)) {
    return res.status(400).json({
      message: "Invalid game id",
    });
  }

  const game = getBlackjackGameById(gameId);

  if (!game) {
    return res.status(404).json({
      message: "Game not found",
    });
  }

  if (game.status !== "playing") {
    return res.status(409).json({
      message: "Game is already finished",
    });
  }

  try {
    const updatedGame = hit(gameId);

    if (!updatedGame) {
      return res.status(404).json({
        message: "Game not found",
      });
    }

    return res.status(200).location(`/blackjack/${updatedGame.id}`).json(updatedGame);
  } catch (error) {
    return res.status(500).json({
      message: "Could not hit",
    });
  } finally {
  }
});

blackjackRouter.post("/:id/stand", (req, res) => {
  const gameId = Number(req.params.id);

  if (!Number.isInteger(gameId)) {
    return res.status(400).json({
      message: "Invalid game id",
    });
  }

  const game = getBlackjackGameById(gameId);

  if (!game) {
    return res.status(404).json({
      message: "Game not found",
    });
  }

  if (game.status !== "playing") {
    return res.status(409).json({
      message: "Game is already finished",
    });
  }

  try {
    const updatedGame = stand(gameId);

    if (!updatedGame) {
      return res.status(404).json({
        message: "Game not found",
      });
    }

    return res.status(200).location(`/blackjack/${updatedGame.id}`).json(updatedGame);
  } catch (error) {
    return res.status(500).json({
      message: "Could not stand",
    });
  } finally {
  }
});
