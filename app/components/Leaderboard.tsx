'use client'

import React, { useEffect, useState } from "react";
import { client } from "./Providers";
import { useGame } from "../context/GameProvider";
import { useRouter } from "next/navigation";

interface LeaderboardRecord {
  rank: number;
  username: string;
  score: number;
  ownerId: string;
}

interface LeaderboardData {
  records: LeaderboardRecord[];
  ownerRecords: LeaderboardRecord[];
}

interface AllLeaderboards {
  wins: LeaderboardData;
  losses: LeaderboardData;
  draws: LeaderboardData;
  score: LeaderboardData;
  time: LeaderboardData;
}

function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export default function Leaderboard() {
  const [data, setData] = useState<AllLeaderboards | null>(null);
  const router = useRouter();
  const { session } = useGame();

  useEffect(() => {

    if (!session) return;

    async function fetchLeaderboards() {
      try {
        const res = await client.rpc(session!, 'get-all-leaderboards', {});
        if (res) {
          console.log(res)
          setData(res.payload as unknown as AllLeaderboards);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboards:', err);
      }
    }

    fetchLeaderboards();
  }, [session]);

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-5xl font-extrabold text-teal-400 drop-shadow-sm mb-2">Match Results</h2>
        <p className="text-zinc-500 text-sm font-medium"></p>
      </div>

      <div className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 text-[10px] uppercase tracking-[0.2em]">
              <th className="py-3 px-2 font-bold">Rank/Name</th>
              <th className="py-3 px-2 font-bold">W/L/D</th>
              <th className="py-3 px-2 font-bold">Time</th>
              <th className="py-3 px-2 font-bold text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900/50">
            {data?.score.records.map((player) => (
              <tr key={player.rank} className="group transition-colors duration-150">
                <td className="py-5 px-2">
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${player.rank === 1
                      ? 'bg-teal-400/10 text-teal-500'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                      }`}>
                      {player.rank}
                    </span>
                    <span className="font-semibold text-sm tracking-tight">{player.username}</span>
                  </div>
                </td>
                <td className="py-5 px-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {data.wins.records.find(r => r.ownerId === player.ownerId)?.score ?? 0}/
                  {data.losses.records.find(r => r.ownerId === player.ownerId)?.score ?? 0}/
                  {data.draws.records.find(r => r.ownerId === player.ownerId)?.score ?? 0}
                </td>
                <td className="py-5 px-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {formatTime(
                    data.time.records.find(r => r.ownerId === player.ownerId)?.score ?? 0
                  )}

                </td>
                <td className="py-5 px-2 text-right font-black text-sm">{player.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <button onClick={() => router.push('/')} className="group relative w-full overflow-hidden rounded-2xl border-2 border-teal-400 py-4 px-6 text-sm font-black tracking-widest text-teal-400 transition-all hover:bg-teal-400 hover:text-white active:scale-[0.98]">
          <span className="relative z-10">PLAY AGAIN</span>
        </button>
      </div>
    </div>
  );
}
