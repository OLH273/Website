import { type Game, type InsertGame, type Player, type InsertPlayer, type UpdatePlayerStats, type UpdateScore } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Game methods
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: string): Promise<Game | undefined>;
  getAllGames(): Promise<Game[]>;
  updateGameScore(gameId: string, homeScore: number, awayScore: number, currentSet: number): Promise<Game | undefined>;
  updateGameSets(gameId: string, sets: any[]): Promise<Game | undefined>;
  endGame(gameId: string): Promise<Game | undefined>;
  
  // Player methods
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayersByGame(gameId: string): Promise<Player[]>;
  updatePlayerStats(update: UpdatePlayerStats): Promise<Player | undefined>;
  deletePlayer(playerId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private games: Map<string, Game>;
  private players: Map<string, Player>;

  constructor() {
    this.games = new Map();
    this.players = new Map();
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = randomUUID();
    const game: Game = {
      ...insertGame,
      id,
      createdAt: new Date(),
    };
    this.games.set(id, game);
    return game;
  }

  async getGame(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getAllGames(): Promise<Game[]> {
    return Array.from(this.games.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateGameScore(gameId: string, homeScore: number, awayScore: number, currentSet: number): Promise<Game | undefined> {
    const game = this.games.get(gameId);
    if (!game) return undefined;

    const updatedGame = {
      ...game,
      homeScore,
      awayScore,
      currentSet,
    };
    this.games.set(gameId, updatedGame);
    return updatedGame;
  }

  async updateGameSets(gameId: string, sets: any[]): Promise<Game | undefined> {
    const game = this.games.get(gameId);
    if (!game) return undefined;

    const updatedGame = {
      ...game,
      sets,
    };
    this.games.set(gameId, updatedGame);
    return updatedGame;
  }

  async endGame(gameId: string): Promise<Game | undefined> {
    const game = this.games.get(gameId);
    if (!game) return undefined;

    const updatedGame = {
      ...game,
      isActive: false,
    };
    this.games.set(gameId, updatedGame);
    return updatedGame;
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = {
      ...insertPlayer,
      id,
    };
    this.players.set(id, player);
    return player;
  }

  async getPlayersByGame(gameId: string): Promise<Player[]> {
    return Array.from(this.players.values())
      .filter(player => player.gameId === gameId)
      .sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  }

  async updatePlayerStats(update: UpdatePlayerStats): Promise<Player | undefined> {
    const player = this.players.get(update.playerId);
    if (!player) return undefined;

    const currentValue = player[update.statType];
    const newValue = update.increment 
      ? currentValue + 1 
      : Math.max(0, currentValue - 1);

    const updatedPlayer = {
      ...player,
      [update.statType]: newValue,
    };
    this.players.set(update.playerId, updatedPlayer);
    return updatedPlayer;
  }

  async deletePlayer(playerId: string): Promise<boolean> {
    return this.players.delete(playerId);
  }
}

export const storage = new MemStorage();
