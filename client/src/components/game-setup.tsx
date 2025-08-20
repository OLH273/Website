import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function GameSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [homeTeamName, setHomeTeamName] = useState("");
  const [awayTeamName, setAwayTeamName] = useState("");
  const fileInputRef = useRef(null);

  // Mutation to create a new game
  const createGameMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/api/games", data);
      return response.json();
    },
    onSuccess: (game) => {
      toast({
        title: "Game Created",
        description: "New game has been started successfully",
      });
      setLocation(`/game/${game.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      });
    },
  });

  // Handle Start Game button
  const handleStartGame = () => {
    if (!homeTeamName.trim() || !awayTeamName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both team names",
        variant: "destructive",
      });
      return;
    }

    createGameMutation.mutate({
      homeTeamName: homeTeamName.trim(),
      awayTeamName: awayTeamName.trim(),
    });
  };

  // Handle Load Game button
  const handleLoadGameClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;

        // Split into rows, trim whitespace, remove empty rows
        const rows = text
          .split("\n")
          .map((row) => row.trim())
          .filter((row) => row.length > 0);

        if (rows.length < 2) throw new Error("CSV must contain header + at least one player");

        // Parse header
        const headers = rows[0]
          .replace(/"/g, "") // remove quotes
          .split(",")
          .map((h) => h.trim());

        // Expected headers
        const expected = ["Player Name", "Team", "Kills", "Assists", "Digs", "Blocks", "Aces", "Errors"];
        const valid = expected.every((h, i) => headers[i] && headers[i].toLowerCase() === h.toLowerCase());
        if (!valid) throw new Error("CSV headers are invalid");

        // Parse players
        const homePlayers = [];
        const awayPlayers = [];

        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].replace(/"/g, "").split(",").map((c) => c.trim());
          if (cols.length !== headers.length) continue; // skip malformed row

          const player = {
            name: cols[0],
            team: cols[1].toLowerCase(),
            kills: Number(cols[2]),
            assists: Number(cols[3]),
            digs: Number(cols[4]),
            blocks: Number(cols[5]),
            aces: Number(cols[6]),
            errors: Number(cols[7]),
          };

          if (player.team === "home") homePlayers.push(player);
          else if (player.team === "away") awayPlayers.push(player);
        }

        if (!homePlayers.length || !awayPlayers.length) {
          throw new Error("CSV must contain at least one player for each team");
        }

        // Create game, keeping scores intact
        const game = await apiRequest("POST", "/api/games", {
          homeTeamName: "Home", // could also grab from UI input
          awayTeamName: "Away",
          homePlayers,
          awayPlayers,
        }).then((res) => res.json());

        toast({
          title: "Game Loaded",
          description: "CSV file loaded successfully with players + stats",
        });

        setLocation(`/game/${game.id}`);
      } catch (error) {
        console.error("CSV Parse Error:", error);
        toast({
          title: "Error",
          description: "Failed to load CSV file",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
  };


  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Game Setup</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">Home Team</Label>
            <Input
              type="text"
              placeholder="Enter team name"
              value={homeTeamName}
              onChange={(e) => setHomeTeamName(e.target.value)}
              className="w-full focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">Away Team</Label>
            <Input
              type="text"
              placeholder="Enter team name"
              value={awayTeamName}
              onChange={(e) => setAwayTeamName(e.target.value)}
              className="w-full focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-4 flex space-x-4">
          <Button
            onClick={handleStartGame}
            disabled={createGameMutation.isPending}
            className="bg-primary text-white hover:bg-blue-700"
          >
            <Play className="mr-2 h-4 w-4" />
            {createGameMutation.isPending ? "Creating..." : "Start New Game"}
          </Button>
          <Button
            onClick={handleLoadGameClick}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Load Game
          </Button>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
