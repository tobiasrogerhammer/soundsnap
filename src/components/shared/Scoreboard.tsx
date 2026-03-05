"use client";

interface Player {
  _id: string;
  name: string;
  score: number;
  userId?: string;
}

export function Scoreboard({
  players,
  spinResultPlayerId,
}: {
  players: Player[];
  spinResultPlayerId?: string;
}) {
  const sorted = [...(players ?? [])].sort((a, b) => b.score - a.score);

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 mb-6">
      <h2 className="text-xs font-medium text-zinc-500 mb-2">Scoreboard</h2>
      <ul className="flex flex-wrap gap-3">
        {sorted.map((p, i) => (
          <li
            key={p._id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
              spinResultPlayerId && (p as { userId?: string }).userId === spinResultPlayerId
                ? "bg-emerald-600/30 text-emerald-400"
                : "bg-zinc-700/50 text-zinc-300"
            }`}
          >
            <span className="text-zinc-500 w-5">#{i + 1}</span>
            <span>{p.name}</span>
            <span className="font-mono font-medium">{p.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
