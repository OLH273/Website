import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// drizzle schema setup
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm"; // ✅ fix #1: sql import
import Papa from "papaparse"; // for parsing CSV
import { db } from "./db"; // ✅ make sure you have a drizzle client here

// games table
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

// players table
export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull(),
  teamType: text("team_type").notNull(), // 'home' or 'away'
  jerseyNumber: integer("jersey_number").notNull().default(0),
  name: text("name").notNull(),
  position: text("position").default("Unknown"), // ✅ avoid errors if CSV doesn’t have it
  kills: integer("kills").notNull().default(0),
  assists: integer("assists").notNull().default(0),
  digs: integer("digs").notNull().default(0),
  blocks: integer("blocks").notNull().default(0),
  aces: integer("aces").notNull().default(0),
  errors: integer("errors").notNull().default(0),
  serves: integer("serves").notNull().default(0),
  servingEfficiency: real("serving_efficiency").notNull().default(0),
});

// ✅ CSV upload + insert into DB
export async function handleCsvUpload(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;

          if (!rows || rows.length === 0) {
            throw new Error("CSV file is empty or invalid");
          }

          // ✅ Create game using team names from first row
          const homeTeamName = rows.find((row) => row.Team?.toLowerCase() === "home")?.Team || "Home";
          const awayTeamName = rows.find((row) => row.Team?.toLowerCase() === "away")?.Team || "Away";

          const game = await db
            .insert(games)
            .values({
              homeTeamName,
              awayTeamName,
            })
            .returning();

          const gameId = game[0]?.id;
          if (!gameId) throw new Error("Game creation failed");

          // ✅ Insert players with stats from CSV
          for (const row of rows) {
            await db.insert(players).values({
              gameId,
              teamType: row.Team?.toLowerCase() || "home",
              jerseyNumber: 0, // CSV doesn’t have jersey number
              name: row["Player Name"] || "Unknown Player",
              position: row.Position || "Unknown",
              kills: parseInt(row.Kills || 0, 10),
              assists: parseInt(row.Assists || 0, 10),
              digs: parseInt(row.Digs || 0, 10),
              blocks: parseInt(row.Blocks || 0, 10),
              aces: parseInt(row.Aces || 0, 10),
              errors: parseInt(row.Errors || 0, 10),
              serves: parseInt(row.Serves || 0, 10),
            });
          }

          resolve({ success: true, gameId });
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}


export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
});

export const updatePlayerStatsSchema = z.object({
  playerId: z.string(),
  statType: z.enum(['kills', 'assists', 'digs', 'blocks', 'aces', 'errors']),
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
