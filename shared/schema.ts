// ==========================
// FRONTEND (React Component)
// ==========================
import React from "react";
import { toast } from "@/components/ui/use-toast"; // adjust import if needed
import { useNavigate } from "react-router-dom"; // or use Next.js router

export default function FileUpload() {
  const navigate = useNavigate();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-players", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload");

      const data = await res.json();

      toast({
        title: "Players Imported",
        description: `${data.count} players loaded successfully`,
      });

      navigate(`/game/${data.gameId}`);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <input
      type="file"
      accept=".csv"
      onChange={handleFileChange}
      className="hidden"
      id="fileInput"
    />
  );
}


// ==========================
// BACKEND (Next.js API Route)
// File: /pages/api/upload-players.ts
// ==========================
import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import csv from "csv-parser";
import { db } from "@/db"; // your drizzle db connection
import { players } from "@/db/schema";

// Disable Next.js body parser (required for file uploads)
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "File upload failed" });
    }

    const file = files.file as formidable.File;
    const gameId = fields.gameId?.toString() || "some-game-id"; // pass in from frontend if needed

    const playerRows: any[] = [];

    fs.createReadStream(file.filepath)
      .pipe(csv())
      .on("data", (row) => {
        playerRows.push({
          gameId,
          teamType: row["Team"].toLowerCase(), // expects "home" or "away"
          jerseyNumber: 0, // update if CSV includes this
          name: row["Player Name"],
          position: row["Position"] || "Unknown",
          kills: parseInt(row["Kills"] || "0", 10),
          assists: parseInt(row["Assists"] || "0", 10),
          digs: parseInt(row["Digs"] || "0", 10),
          blocks: parseInt(row["Blocks"] || "0", 10),
          aces: parseInt(row["Aces"] || "0", 10),
          errors: parseInt(row["Errors"] || "0", 10),
        });
      })
      .on("end", async () => {
        await db.insert(players).values(playerRows);

        res.status(200).json({
          message: "Players imported successfully",
          count: playerRows.length,
          gameId,
        });
      });
  });
}
