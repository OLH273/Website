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

  // Stats (taken from CSV, no default values)
  kills: integer("kills"),
  assists: integer("assists"),
  digs: integer("digs"),
  blocks: integer("blocks"),
  aces: integer("aces"),
  errors: integer("errors"),
  serves: integer("serves"),
  servingEfficiency: real("serving_efficiency"), // stays null if not set
});



// Handles a CSV file input for loading a game
export async function handleCsvUpload(file: File) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data; // array of player rows

          if (rows.length === 0) throw new Error("Empty CSV");

          // --- Create game using team names ---
          const homeTeam = rows.find((row: any) => row.Team?.toLowerCase() === "home")?.Team || "Home";
          const awayTeam = rows.find((row: any) => row.Team?.toLowerCase() === "away")?.Team || "Away";

          const game = await db.insert(games).values({
            homeTeamName: homeTeam,
            awayTeamName: awayTeam,
          }).returning();

          const gameId = game[0].id;

          // --- Insert players ---
          for (const row of rows) {
            await db.insert(players).values({
              gameId,
              teamType: row.Team?.toLowerCase() === "home" ? "home" : "away",
              jerseyNumber: 0, // Could extend CSV to include numbers
              name: row["Player Name"],
              position: "unknown", // Could extend CSV to include positions
              kills: parseInt(row.Kills || "0", 10),
              assists: parseInt(row.Assists || "0", 10),
              digs: parseInt(row.Digs || "0", 10),
              blocks: parseInt(row.Blocks || "0", 10),
              aces: parseInt(row.Aces || "0", 10),
              errors: parseInt(row.Errors || "0", 10),
              serves: parseInt(row.Serves || "0", 10),
              servingEfficiency: null, // left empty since we aren’t calculating
            });
          }

          resolve(gameId);
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
