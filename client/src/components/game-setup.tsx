import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GameSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [homeTeamName, setHomeTeamName] = useState("");
  const [awayTeamName, setAwayTeamName] = useState("");

  const createGameMutation = useMutation({
    mutationFn: async (data: { homeTeamName: string; awayTeamName: string }) => {
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
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Load Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
