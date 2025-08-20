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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Mutation to create a new game
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

  // Mutation to upload an existing game file
  const uploadGameMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/games/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      return response.json();
    },
    onSuccess: (game) => {
      toast({
        title: "Game Loaded",
        description: "Existing game has been loaded successfully",
      });
      setLocation(`/game/${game.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load game",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadGame = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    uploadGameMutation.mutate(selectedFile);
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

        <div className="mt-4 flex space-x-4 items-center">
          <Button 
            onClick={handleStartGame}
            disabled={createGameMutation.isPending}
            className="bg-primary text-white hover:bg-blue-700"
          >
            <Play className="mr-2 h-4 w-4" />
            {createGameMutation.isPending ? "Creating..." : "Start New Game"}
          </Button>

          {/* File Upload Section */}
          <input
            type="file"
            accept=".json,.csv"
            id="game-upload"
            className="hidden"
            onChange={handleFileChange}
          />
          <label htmlFor="game-upload">
            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-50">
              <Upload className="mr-2 h-4 w-4" />
              {selectedFile ? selectedFile.name : "Load Game"}
            </div>
          </label>

          {selectedFile && (
            <Button
              onClick={handleUploadGame}
              disabled={uploadGameMutation.isPending}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              {uploadGameMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
