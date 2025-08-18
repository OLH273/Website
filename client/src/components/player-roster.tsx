import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlayerRosterProps {
  gameId: string;
  teamType: 'home' | 'away';
  teamName: string;
  players: any[];
  onAddPlayer: () => void;
}

export default function PlayerRoster({ 
  gameId, 
  teamType, 
  teamName, 
  players, 
  onAddPlayer 
}: PlayerRosterProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateStatsMutation = useMutation({
    mutationFn: async (data: { playerId: string; statType: string; increment: boolean }) => {
      const response = await apiRequest("PATCH", "/api/players/stats", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games', gameId, 'players'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update player stats",
        variant: "destructive",
      });
    },
  });

  const handleStatChange = (playerId: string, statType: string, increment: boolean) => {
    updateStatsMutation.mutate({ playerId, statType, increment });
  };

  const getStatColor = (statType: string) => {
    const colors = {
      kills: 'text-error',
      assists: 'text-info',
      digs: 'text-secondary',
      blocks: 'text-purple-600',
      aces: 'text-success',
      errors: 'text-error'
    };
    return colors[statType as keyof typeof colors] || 'text-gray-600';
  };

  const teamColor = teamType === 'home' ? 'text-primary' : 'text-secondary';

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${teamColor}`}>{teamName} Roster</h2>
          <Button
            onClick={onAddPlayer}
            variant="ghost"
            size="sm"
            className={`${teamColor} hover:bg-gray-100`}
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {players.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No players added yet</p>
              <Button onClick={onAddPlayer} variant="outline" className="mt-2">
                <UserPlus className="mr-2 h-4 w-4" />
                Add First Player
              </Button>
            </div>
          ) : (
            players.map((player) => {
              const totalPoints = player.kills + player.assists + player.digs + player.blocks + player.aces;
              
              return (
                <div key={player.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="font-bold text-lg">#{player.jerseyNumber}</span>
                      <span className="ml-2 font-medium">{player.name}</span>
                      <span className="ml-2 text-sm text-gray-600">{player.position}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total Points</div>
                      <div className={`text-lg font-bold ${teamColor}`}>{totalPoints}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {['kills', 'assists', 'digs'].map((statType) => (
                      <div key={statType} className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatChange(player.id, statType, false)}
                            disabled={updateStatsMutation.isPending || player[statType] <= 0}
                            className="w-8 h-8 p-0 bg-red-100 text-red-600 hover:bg-red-200"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="flex-1 text-center">
                            <div className="text-xs text-gray-600 capitalize">{statType}</div>
                            <div className={`text-lg font-bold ${getStatColor(statType)}`}>
                              {player[statType]}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatChange(player.id, statType, true)}
                            disabled={updateStatsMutation.isPending}
                            className="w-8 h-8 p-0 bg-green-100 text-green-600 hover:bg-green-200"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {['blocks', 'aces', 'errors'].map((statType) => (
                      <div key={statType} className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatChange(player.id, statType, false)}
                            disabled={updateStatsMutation.isPending || player[statType] <= 0}
                            className="w-8 h-8 p-0 bg-red-100 text-red-600 hover:bg-red-200"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="flex-1 text-center">
                            <div className="text-xs text-gray-600 capitalize">{statType}</div>
                            <div className={`text-lg font-bold ${getStatColor(statType)}`}>
                              {player[statType]}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatChange(player.id, statType, true)}
                            disabled={updateStatsMutation.isPending}
                            className="w-8 h-8 p-0 bg-green-100 text-green-600 hover:bg-green-200"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
