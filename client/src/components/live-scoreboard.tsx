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
  const [lastAction, setLastAction] = useState<{
    type: 'score' | 'set';
    previousState: {
      homeScore: number;
      awayScore: number;
      currentSet: number;
      sets: any[];
    };
  } | null>(null);

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
      setLastAction(null); // Clear undo history after successful undo
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

  const handleAddPoint = (teamType: 'home' | 'away') => {
    if (!game) return;
    
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
      setLastAction({
        type: 'set',
        previousState,
      });
      
      // Update sets and move to next set (if not game over)
      updateSetsMutation.mutate({
        sets: newSets,
        currentSet: game.currentSet < 5 ? game.currentSet + 1 : game.currentSet,
        homeScore: game.currentSet < 5 ? 0 : newHomeScore,
        awayScore: game.currentSet < 5 ? 0 : newAwayScore,
      });
    } else {
      // Store undo state for regular score
      setLastAction({
        type: 'score',
        previousState,
      });
      
      // Just update the score
      updateScoreMutation.mutate({
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        currentSet: game.currentSet,
      });
    }
  };

  const handleUndo = () => {
    if (!lastAction) return;
    undoMutation.mutate(lastAction.previousState);
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
                <div className="text-2xl font-bold text-primary">{game.homeTeamName}</div>
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
                    className={`p-2 rounded ${
                      isCurrentSet 
                        ? 'bg-primary bg-opacity-10 border-2 border-primary'
                        : isCompleted
                        ? 'bg-gray-100'
                        : 'bg-gray-50 border border-dashed border-gray-300'
                    }`}
                  >
                    <div className={`font-medium ${isCurrentSet ? 'text-primary' : isCompleted ? '' : 'text-gray-400'}`}>
                      Set {setNum}
                    </div>
                    <div className={`font-bold ${isCurrentSet ? 'text-primary' : isCompleted ? 'text-primary' : 'text-gray-400'}`}>
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
              disabled={updateScoreMutation.isPending || updateSetsMutation.isPending}
              className="w-full bg-primary text-white hover:bg-green-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              {game.homeTeamName} +1
            </Button>
            <Button
              onClick={() => handleAddPoint('away')}
              disabled={updateScoreMutation.isPending || updateSetsMutation.isPending}
              className="w-full bg-secondary text-white hover:bg-orange-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              {game.awayTeamName} +1
            </Button>
            <Button
              onClick={handleUndo}
              disabled={!lastAction || undoMutation.isPending}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Undo className="mr-2 h-4 w-4" />
              {undoMutation.isPending ? "Undoing..." : "Undo Last"}
            </Button>
            <Button
              className="w-full bg-warning text-white hover:bg-yellow-600"
            >
              <SquareCheck className="mr-2 h-4 w-4" />
              End Set
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
