import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import GameSetup from "@/components/game-setup";
import LiveScoreboard from "@/components/live-scoreboard";
import PlayerRoster from "@/components/player-roster";
import GameSummary from "@/components/game-summary";
import PlayerModal from "@/components/player-modal";
import { Volleyball } from "lucide-react";

export default function GameTracker() {
  const { gameId } = useParams();
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');

  const { data: game, isLoading } = useQuery({
    queryKey: ['/api/games', gameId],
    enabled: !!gameId,
  });

  const { data: players = [] } = useQuery({
    queryKey: ['/api/games', gameId, 'players'],
    enabled: !!gameId,
  });

  const handleAddPlayer = (teamType: 'home' | 'away') => {
    setSelectedTeam(teamType);
    setShowPlayerModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Volleyball className="h-12 w-12 text-primary animate-bounce mx-auto mb-4" />
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-roboto">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center">
              <Volleyball className="mr-3" />
              VolleyTracker Pro
            </h1>
            <div className="flex items-center space-x-4">
              {game?.isActive && (
                <span className="bg-success px-3 py-1 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-white rounded-full inline-block mr-1"></div>
                  Live Game
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {!gameId ? (
          <GameSetup />
        ) : (
          <>
            <LiveScoreboard gameId={gameId} game={game} />
            
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <PlayerRoster
                gameId={gameId}
                teamType="home"
                teamName={game?.homeTeamName || "Home Team"}
                players={players.filter((p: any) => p.teamType === 'home')}
                onAddPlayer={() => handleAddPlayer('home')}
              />
              <PlayerRoster
                gameId={gameId}
                teamType="away"
                teamName={game?.awayTeamName || "Away Team"}
                players={players.filter((p: any) => p.teamType === 'away')}
                onAddPlayer={() => handleAddPlayer('away')}
              />
            </div>

            <GameSummary 
              gameId={gameId}
              game={game}
              players={players}
            />
          </>
        )}
      </div>

      <PlayerModal
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        gameId={gameId}
        teamType={selectedTeam}
      />
    </div>
  );
}
