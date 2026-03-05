"use client";

interface Player {
  _id: string;
  name: string;
  ready: boolean;
  score: number;
}

export function PlayerList({
  players,
  currentUserName,
}: {
  players: Player[];
  currentUserName: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
      <h2 className="text-sm font-medium text-zinc-400 mb-3">Players</h2>
      <ul className="space-y-2">
        {players.map((p) => (
          <li
            key={p._id}
            className="flex items-center justify-between text-sm"
          >
            <span className={p.name === currentUserName ? "text-emerald-400" : ""}>
              {p.name}
              {p.name === currentUserName ? " (you)" : ""}
            </span>
            <span
              className={
                p.ready
                  ? "text-emerald-500 text-xs"
                  : "text-zinc-500 text-xs"
              }
            >
              {p.ready ? "Ready" : "Not ready"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
