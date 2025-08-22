// pages/api/games.ts
import { db } from "@/lib/db";
import { games, players } from "@/lib/schema";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { homeTeamName, awayTeamName, homePlayers = [], awayPlayers = [] } = req.body;

      // 1️⃣ Create game
      const [game] = await db.insert(games)
        .values({ homeTeamName, awayTeamName })
        .returning("*");

      // 2️⃣ Prepare player inserts
      const insertPlayers = [...homePlayers, ...awayPlayers].map(p => ({
        gameId: game.id,
        teamType: p.team,
        jerseyNumber: p.jerseyNumber || 0,
        name: p.name,
        position: p.position || "",
        kills: p.kills,
        assists: p.assists,
        digs: p.digs,
        blocks: p.blocks,
        aces: p.aces,
        errors: p.errors,
        serves: p.serves || 0,
      }));

      // 3️⃣ Insert players
      if (insertPlayers.length > 0) {
        await db.insert(players).values(insertPlayers);
      }

      res.status(200).json(game);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create game" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
