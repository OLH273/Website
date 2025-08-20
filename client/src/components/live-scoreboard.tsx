'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getGameById } from '@/lib/fetchGame';
import { db } from '@/lib/db';

interface Game {
  id: string;
  home: string;
  away: string;
  sets: {
    homeScore: number;
    awayScore: number;
    completed: boolean;
  }[];
}

interface Props {
  gameId: string;
}

export default function LiveScoreboard({ gameId }: Props) {
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      const data = await getGameById(gameId);
      setGame(data);
    };
    fetchGame();
  }, [gameId]);

  const exportToCSV = (game: Game | null) => {
    if (!game) return;

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

  if (!game) return <p>Loading...</p>;

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">{game.home} vs {game.away}</h2>
      <div className="space-y-2">
        {game.sets.map((set, index) => (
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
