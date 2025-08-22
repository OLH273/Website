import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeTeamName: text("home_team_name").notNull(),
  awayTeamName: text("away_team_name").notNull(),
  currentSet: integer("current_set").notNull().default(1),
  homeScore: integer("home_score").notNull().default(0),
  awayScore: integer("away_score").notNull().default(0),
  sets: jsonb("sets").notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull(),
  teamType: text("team_type").notNull(), // 'home' or 'away'
  jerseyNumber: integer("jersey_number").notNull(),
  name: text("name").notNull(),
  position: text("position").notNull(),

  // ⚡ Remove defaults here, so CSV data must provide values
  kills: integer("kills").notNull(),
  assists: integer("assists").notNull(),
  digs: integer("digs").notNull(),
  blocks: integer("blocks").notNull(),
  aces: integer("aces").notNull(),
  errors: integer("errors").notNull(),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
});

export const updatePlayerStatsSchema = z.object({
  playerId: z.string(),
  statType: z.enum(["kills", "assists", "digs", "blocks", "aces", "errors"]),
  increment: z.boolean(),
});

export const updateScoreSchema = z.object({
  gameId: z.string(),
  teamType: z.enum(["home", "away"]),
  points: z.number().min(0),
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type UpdatePlayerStats = z.infer<typeof updatePlayerStatsSchema>;
export type UpdateScore = z.infer<typeof updateScoreSchema>;
