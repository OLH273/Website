import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSchema, insertPlayerSchema, updatePlayerStatsSchema, updateScoreSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Game routes
  app.post("/api/games", async (req, res) => {
    try {
      console.log("body incoming", req.body)
      const gameData = insertGameSchema.parse(req.body);
      console.log("game data", gameData)
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      res.status(400).json({ message: "Invalid game data" });
    }
  });

  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGame(req.params.id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.patch("/api/games/:id/score", async (req, res) => {
    try {
      console.log("Score update request body:", req.body);
      const { homeScore, awayScore, currentSet } = z.object({
        homeScore: z.number().min(0),
        awayScore: z.number().min(0),
        currentSet: z.number().min(1).max(5),
      }).parse(req.body);

      const game = await storage.updateGameScore(req.params.id, homeScore, awayScore, currentSet);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("Score update error:", error);
      res.status(400).json({ message: "Invalid score data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/games/:id/sets", async (req, res) => {
    try {
      const { sets } = z.object({
        sets: z.array(z.object({
          homeScore: z.number(),
          awayScore: z.number(),
          completed: z.boolean(),
        })),
      }).parse(req.body);

      const game = await storage.updateGameSets(req.params.id, sets);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(400).json({ message: "Invalid sets data" });
    }
  });

  app.patch("/api/games/:id/end", async (req, res) => {
    try {
      const game = await storage.endGame(req.params.id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to end game" });
    }
  });

  // Player routes
  app.post("/api/players", async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      res.json(player);
    } catch (error) {
      res.status(400).json({ message: "Invalid player data" });
    }
  });

  app.get("/api/games/:gameId/players", async (req, res) => {
    try {
      const players = await storage.getPlayersByGame(req.params.gameId);
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.patch("/api/players/stats", async (req, res) => {
    try {
      const updateData = updatePlayerStatsSchema.parse(req.body);
      const player = await storage.updatePlayerStats(updateData);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      res.status(400).json({ message: "Invalid stats update data" });
    }
  });

  app.delete("/api/players/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePlayer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json({ message: "Player deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete player" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
