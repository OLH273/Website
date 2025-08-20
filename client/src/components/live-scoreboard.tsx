import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Undo, SquareCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LiveScoreboardProps {
  gameId: string;
  game: any;
}

export default function LiveScoreboard({ gameId, game }: LiveScoreboardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [actionHistory, setActionHistory] = useState<{
    type: 'score' | 'set';
    previousState: {
      homeScore: number;
      awayScore: number;
      currentSet: number;
      sets: any[];
    };
  }[]>([]);

  const updateScoreMutation = useMutation({
    mutationFn: async (data: { homeScore: number; awayScore: number; currentSet: number }) => {
      const response = await apiRequest("PATCH", `/api/games/${gameId}/score`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games', gameId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update score",
        variant: "destructive",
      });
    },
  });

  const updateSetsMutation = useMutation({
    mutationFn: async (data: { sets: any[]; currentSet: number; homeScore: number; awayScore: number }) => {
      // First update the sets
      await apiRequest("PATCH", `/api/games/${gameId}/sets`, { sets: data.sets });
      // Then update the score and current set
      const response = await apiRequest("PATCH", `/api/games/${gameId}/score`, { 
        homeScore: data.homeScore, 
        awayScore: data.awayScore, 
        currentSet: data.currentSet 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games', gameId] });
      toast({
        title: "Set Complete!",
        description: "Moving to next set",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete set",
        variant: "destructive",
      });
    },
  });

  const undoMutation = useMutation({
    mutationFn: async (previousState: { homeScore: number; awayScore: number; currentSet: number; sets: any[] }) => {
      // First update sets if needed
      await apiRequest("PATCH", `/api/games/${gameId}/sets`, { sets: previousState.sets });
      // Then update the score and current set
      const response = await apiRequest("PATCH", `/api/games/${gameId}/score`, { 
        homeScore: previousState.homeScore, 
        awayScore: previousState.awayScore, 
        currentSet: previousState.currentSet 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games', gameId] });
      // Remove the last action from history
      setActionHistory(prev => prev.slice(0, -1));
      toast({
        title: "Undone",
        description: "Last action has been undone",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to undo last action",
        variant: "destructive",
      });
    },
  });

  const checkSetWin = (homeScore: number, awayScore: number) => {
    // Win condition: reach 25 points and be at least 2 points ahead
    // If tied at 24-24 or higher, need to win by 2
    const minWinScore = 25;
    const minLead = 2;
    
    if (homeScore >= minWinScore && homeScore - awayScore >= minLead) {
      return 'home';
    }
    if (awayScore >= minWinScore && awayScore - homeScore >= minLead) {
      return 'away';
    }
    return null;
  };

  const getEndSetButtonText = () => {
    if (!game) return "End Set";
    if (updateSetsMutation.isPending) return "Ending Set...";
    
    // Check if this would end the game
    const currentSets = Array.isArray(game.sets) ? game.sets : [];
    const homeSetsWon = currentSets.filter((set: any) => 
      set.completed && set.homeScore > set.awayScore
    ).length;
    const awaySetsWon = currentSets.filter((set: any) => 
      set.completed && set.awayScore > set.homeScore
    ).length;
    
    const wouldEndGame = game.currentSet >= 5 || homeSetsWon >= 2 || awaySetsWon >= 2;
    
    return wouldEndGame ? "End Game" : "End Set";
  };

  const isGameOver = () => {
    if (!game) return false;
    const sets = Array.isArray(game.sets) ? game.sets : [];
    const homeSetsWon = sets.filter((set: any) => 
      set.completed && set.homeScore > set.awayScore
    ).length;
    const awaySetsWon = sets.filter((set: any) => 
      set.completed && set.awayScore > set.homeScore
    ).length;
    
    return game.status === 'ended' || homeSetsWon >= 3 || awaySetsWon >= 3;
  };

  const handleAddPoint = (teamType: 'home' | 'away') => {
    if (!game || isGameOver()) return;
    
    // Store current state before making changes
    const previousState = {
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      currentSet: game.currentSet,
      sets: Array.isArray(game.sets) ? [...game.sets] : [],
    };
    
    const newHomeScore = teamType === 'home' ? game.homeScore + 1 : game.homeScore;
    const newAwayScore = teamType === 'away' ? game.awayScore + 1 : game.awayScore;
    
    // Check if this point wins the set
    const setWinner = checkSetWin(newHomeScore, newAwayScore);
    
    if (setWinner) {
      // End the current set and move to next set
      const newSets = [...(Array.isArray(game.sets) ? game.sets : [])];
      newSets[game.currentSet - 1] = {
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        completed: true,
      };
      
      // Store undo state for set completion
      setActionHistory(prev => [...prev, {
        type: 'set',
        previousState,
      }]);
      
      // Check if game should end after this set
      const homeSetsWon = newSets.filter((set: any) => 
        set.completed && set.homeScore > set.awayScore
      ).length;
      const awaySetsWon = newSets.filter((set: any) => 
        set.completed && set.awayScore > set.homeScore
      ).length;
      
      const gameOver = game.currentSet >= 5 || homeSetsWon >= 3 || awaySetsWon >= 3;
      
      if (gameOver) {
        // End the game
        updateSetsMutation.mutate({
          sets: newSets,
          currentSet: game.currentSet,
          homeScore: newHomeScore,
          awayScore: newAwayScore,
        });
        // End the game status
        apiRequest("PATCH", `/api/games/${gameId}/end`, {});
      } else {
        // Move to next set
        updateSetsMutation.mutate({
          sets: newSets,
          currentSet: game.currentSet + 1,
          homeScore: 0,
          awayScore: 0,
        });
      }
    } else {
      // Store undo state for regular score
      setActionHistory(prev => [...prev, {
        type: 'score',
        previousState,
      }]);
      
      // Just update the score
      updateScoreMutation.mutate({
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        currentSet: game.currentSet,
      });
    }
  };

  const handleUndo = () => {
    if (actionHistory.length === 0) return;
    const lastAction = actionHistory[actionHistory.length - 1];
    undoMutation.mutate(lastAction.previousState);
  };

  const handleEndSet = () => {
    if (!game || isGameOver()) return;
    
    // Store current state for undo
    const previousState = {
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      currentSet: game.currentSet,
      sets: Array.isArray(game.sets) ? [...game.sets] : [],
    };
    
    // Complete current set with current scores
    const newSets = [...(Array.isArray(game.sets) ? game.sets : [])];
    newSets[game.currentSet - 1] = {
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      completed: true,
    };
    
    // Store undo state
    setActionHistory(prev => [...prev, {
      type: 'set',
      previousState,
    }]);
    
    // Check if game should end (after 5 sets or if one team won 3 sets)
    const homeSetsWon = newSets.filter(set => 
      set.completed && set.homeScore > set.awayScore
    ).length;
    const awaySetsWon = newSets.filter(set => 
      set.completed && set.awayScore > set.homeScore
    ).length;
    
    const gameOver = game.currentSet >= 5 || homeSetsWon >= 3 || awaySetsWon >= 3;
    
    if (gameOver) {
      // End the game
      updateSetsMutation.mutate({
        sets: newSets,
        currentSet: game.currentSet,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      });
      // End the game status
      apiRequest("PATCH", `/api/games/${gameId}/end`, {});
    } else {
      // Move to next set
      updateSetsMutation.mutate({
        sets: newSets,
        currentSet: game.currentSet + 1,
        homeScore: 0,
        awayScore: 0,
      });
    }
  };

  if (!game) return null;

  const sets = Array.isArray(game.sets) ? game.sets : [];

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Display */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Live Score</h2>
              <div className="text-sm text-gray-600">
                Set {game.currentSet} of 5
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#0d00ff]">{game.homeTeamName}</div>
                <div className="text-6xl font-bold text-gray-800">{game.homeScore}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{game.awayTeamName}</div>
                <div className="text-6xl font-bold text-gray-800">{game.awayScore}</div>
              </div>
            </div>

            {/* Set History */}
            <div className="grid grid-cols-5 gap-2 text-center text-sm">
              {[1, 2, 3, 4, 5].map((setNum) => {
                const setData = sets[setNum - 1];
                const isCurrentSet = setNum === game.currentSet;
                const isCompleted = setData?.completed;
                
                return (
                  <div
                    key={setNum}
                    className="p-2 rounded border-2 border-primary text-center text-[18px] font-normal pt-[10px] pb-[10px] pl-[6px] pr-[6px] ml-[2px] mr-[2px] mt-[8px] mb-[8px] bg-[#c5ccf0]"
                  >
                    <div className="font-medium text-[#000000]">
                      Set {setNum}
                    </div>
                    <div className="font-bold text-[#0022fa]">
                      {setData?.homeScore ?? (isCurrentSet ? game.homeScore : '-')}
                    </div>
                    <div className={`font-bold ${isCurrentSet ? 'text-secondary' : isCompleted ? 'text-secondary' : 'text-gray-400'}`}>
                      {setData?.awayScore ?? (isCurrentSet ? game.awayScore : '-')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800">Quick Actions</h3>
            <Button
              onClick={() => handleAddPoint('home')}
              disabled={isGameOver() || updateScoreMutation.isPending || updateSetsMutation.isPending}
              className="w-full bg-primary text-white hover:bg-green-600 disabled:opacity-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              {game.homeTeamName} +1
            </Button>
            <Button
              onClick={() => handleAddPoint('away')}
              disabled={isGameOver() || updateScoreMutation.isPending || updateSetsMutation.isPending}
              className="w-full bg-secondary text-white hover:bg-orange-600 disabled:opacity-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              {game.awayTeamName} +1
            </Button>
            <Button
              onClick={handleUndo}
              disabled={actionHistory.length === 0 || undoMutation.isPending}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Undo className="mr-2 h-4 w-4" />
              {undoMutation.isPending ? "Undoing..." : `Undo Last (${actionHistory.length})`}
            </Button>
            <Button
              onClick={handleEndSet}
              disabled={isGameOver() || updateSetsMutation.isPending}
              className="w-full bg-warning text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              <SquareCheck className="mr-2 h-4 w-4" />
              {getEndSetButtonText()}
            </Button>
            {isGameOver() && (
              <div className="p-3 bg-gray-100 rounded-lg text-center">
                <p className="font-bold text-gray-800">Game Ended</p>
                <p className="text-sm text-gray-600">No more scoring allowed</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
