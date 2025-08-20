import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Download, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GameSummaryProps {
  gameId: string;
  game: any;
  players: any[];
}

export default function GameSummary({ gameId, game, players }: GameSummaryProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const endGameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/games/${gameId}/end`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games', gameId] });
      toast({
        title: "Game Ended",
        description: "Game has been ended successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to end game",
        variant: "destructive",
      });
    },
  });

  // Export player stats as CSV
  const handleExportStats = () => {
    if (!game || !players) return;

    const headers = [
      "Player Name",
      "Team",
      "Kills",
      "Assists",
      "Digs",
      "Blocks",
      "Aces",
      "Errors",
    ];

    const rows = players.map(p => [
      p.name,
      p.teamType,
      p.kills,
      p.assists,
      p.digs,
      p.blocks,
      p.aces,
      p.errors,
    ]);

    const csvContent = [headers, ...rows]
      .map(r => r.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `volleyball-stats-${game.homeTeamName}-vs-${game.awayTeamName}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Stats Exported",
      description: "Game statistics have been exported as CSV",
    });
  };

  // Save game set scores as CSV
  const handleSaveGame = () => {
    if (!game || !game.sets) return;

    const headers = ["Set Number", `${game.homeTeamName} Score`, `${game.awayTeamName} Score`];

    const rows = game.sets.map((set: any, index: number) => [
      index + 1,
      set.homeScore,
      set.awayScore,
    ]);

    const csvContent = [headers, ...rows]
      .map(r => r.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `volleyball-set-scores-${game.homeTeamName}-vs-${game.awayTeamName}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Game Saved",
      description: "Set scores have been saved as CSV",
    });
  };

  if (!game || !players) return null;

  const homePlayers = players.filter(p => p.teamType === 'home');
  const awayPlayers = players.filter(p => p.teamType === 'away');

  const calculateTeamStats = (teamPlayers: any[]) => {
    return teamPlayers.reduce((totals, player) => ({
      kills: totals.kills + player.kills,
      assists: totals.assists + player.assists,
      digs: totals.digs + player.digs,
      blocks: totals.blocks + player.blocks,
      aces: totals.aces + player.aces,
      errors: totals.errors + player.errors,
    }), {
      kills: 0,
      assists: 0,
      digs: 0,
      blocks: 0,
      aces: 0,
      errors: 0,
    });
  };

  const homeStats = calculateTeamStats(homePlayers);
  const awayStats = calculateTeamStats(awayPlayers);

  return (
    <Card className="shadow-lg mt-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Game Statistics Summary</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">{game.homeTeamName} Team Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold text-primary">{homeStats.kills}</div>
                <div className="text-sm text-gray-600">Total Kills</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold text-primary">{homeStats.assists}</div>
                <div className="text-sm text-gray-600">Total Assists</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold text-primary">{homeStats.digs}</div>
                <div className="text-sm text-gray-600">Total Digs</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold text-primary">{homeStats.blocks}</div>
                <div className="text-sm text-gray-600">Total Blocks</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-secondary mb-3">{game.awayTeamName} Team Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-2xl font-bold text-secondary">{awayStats.kills}</div>
                <div className="text-sm text-gray-600">Total Kills</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-2xl font-bold text-secondary">{awayStats.assists}</div>
                <div className="text-sm text-gray-600">Total Assists</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-2xl font-bold text-secondary">{awayStats.digs}</div>
                <div className="text-sm text-gray-600">Total Digs</div>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-2xl font-bold text-secondary">{awayStats.blocks}</div>
                <div className="text-sm text-gray-600">Total Blocks</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <Button
            className="bg-success text-white hover:bg-green-600"
            onClick={handleSaveGame}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Game
          </Button>
          <Button
            variant="outline"
            onClick={handleExportStats}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Stats
          </Button>
          <Button
            onClick={() => endGameMutation.mutate()}
            disabled={endGameMutation.isPending}
            className="bg-error text-white hover:bg-red-600"
          >
            <StopCircle className="mr-2 h-4 w-4" />
            {endGameMutation.isPending ? "Ending..." : "End Game"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
