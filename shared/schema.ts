import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean, real } from "drizzle-orm/pg-core";
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
  kills: integer("kills").notNull().default(0),
  assists: integer("assists").notNull().default(0),
  digs: integer("digs").notNull().default(0),
  blocks: integer("blocks").notNull().default(0),
  aces: integer("aces").notNull().default(0),
  errors: integer("errors").notNull().default(0),
  serves: integer("serves").notNull().default(0),
  servingEfficiency: real("serving_efficiency").notNull().default(0),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  servingEfficiency: true, // cannot be edited directly
});

export const updatePlayerStatsSchema = z.object({
  playerId: z.string(),
  statType: z.enum(['kills', 'assists', 'digs', 'blocks', 'aces', 'errors', 'serves']),
  increment: z.boolean(),
});

export const updateScoreSchema = z.object({
  gameId: z.string(),
  teamType: z.enum(['home', 'away']),
  points: z.number().min(0),
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type UpdatePlayerStats = z.infer<typeof updatePlayerStatsSchema>;
export type UpdateScore = z.infer<typeof updateScoreSchema>;
