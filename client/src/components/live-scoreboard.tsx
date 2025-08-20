'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Game } from '@shared/schema';

interface Props {
  gameId: string;
}

export default function LiveScoreboard({ gameId }: Props) {
  const { data: game, isLoading, error } = useQuery<Game>({
    queryKey: ['/api/games', gameId],
    enabled: !!gameId,
  });

  const exportToCSV = (game: Game) => {
    if (!game || !Array.isArray(game.sets)) return;

    const headers = ['Set', 'Home Score', 'Away Score', 'Completed'];
    const rows = game.sets.map((set, index) => [
      index + 1,
      set.homeScore ?? '',
      set.awayScore ?? '',
      set.completed ? 'Yes' : 'No',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `game_${gameId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading game data</p>;
  if (!game) return <p>Game not found</p>;

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">{game.homeTeamName} vs {game.awayTeamName}</h2>
      <div className="space-y-2">
        {Array.isArray(game.sets) && game.sets.map((set, index) => (
          <div key={index} className="flex justify-between bg-gray-100 p-2 rounded">
            <span>Set {index + 1}</span>
            <span>{set.homeScore} - {set.awayScore}</span>
            <span>{set.completed ? '✔' : '✖'}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Button
          onClick={() => exportToCSV(game)}
          className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Export Game
        </Button>
      </div>
    </div>
  );
}
