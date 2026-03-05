"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const GENRES = ["Pop", "2000s", "80s", "Country", "Norwegian"];

const MAX_POINTS_OPTIONS = [5, 10, 15, 20];

type GameSettings = {
  gameMode: "solo" | "teams";
  maxPoints: number;
  selectedGenres: string[];
  modifiers?: {
    doublePointsRounds?: boolean;
    losePointsRounds?: boolean;
    hintEnabled?: boolean;
  };
};

export function LobbySettings({
  roomId,
  gameSettings,
  onStartGame,
  canStart,
}: {
  roomId: Id<"rooms">;
  gameSettings: GameSettings;
  onStartGame: () => void;
  canStart: boolean;
}) {
  const updateSettings = useMutation(api.rooms.updateSettings);
  const [mode, setMode] = useState<"solo" | "teams">(gameSettings.gameMode);
  const [maxPoints, setMaxPoints] = useState(gameSettings.maxPoints);
  const [genres, setGenres] = useState<string[]>(gameSettings.selectedGenres);
  const [doublePoints, setDoublePoints] = useState(
    gameSettings.modifiers?.doublePointsRounds ?? false
  );
  const [losePoints, setLosePoints] = useState(
    gameSettings.modifiers?.losePointsRounds ?? false
  );
  const [hintEnabled, setHintEnabled] = useState(
    gameSettings.modifiers?.hintEnabled ?? false
  );

  function toggleGenre(g: string) {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  async function saveSettings() {
    await updateSettings({
      roomId,
      gameSettings: {
        gameMode: mode,
        maxPoints,
        selectedGenres: genres,
        modifiers: {
          doublePointsRounds: doublePoints,
          losePointsRounds: losePoints,
          hintEnabled,
        },
      },
    });
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 space-y-4">
      <h2 className="text-sm font-medium text-zinc-400">Game settings</h2>

      <div>
        <label className="block text-xs text-zinc-500 mb-1">Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("solo")}
            className={`px-3 py-1.5 rounded text-sm ${
              mode === "solo" ? "bg-emerald-600" : "bg-zinc-700"
            }`}
          >
            Solo
          </button>
          <button
            onClick={() => setMode("teams")}
            className={`px-3 py-1.5 rounded text-sm ${
              mode === "teams" ? "bg-emerald-600" : "bg-zinc-700"
            }`}
          >
            Teams
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1">
          Points to win
        </label>
        <select
          value={maxPoints}
          onChange={(e) => setMaxPoints(Number(e.target.value))}
          className="w-full px-3 py-2 rounded bg-zinc-700 border border-zinc-600 text-sm"
        >
          {MAX_POINTS_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-2">Genres</label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className={`px-3 py-1.5 rounded text-sm ${
                genres.includes(g) ? "bg-emerald-600" : "bg-zinc-700"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={doublePoints}
            onChange={(e) => setDoublePoints(e.target.checked)}
          />
          Double points rounds
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={losePoints}
            onChange={(e) => setLosePoints(e.target.checked)}
          />
          Lose points rounds
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hintEnabled}
            onChange={(e) => setHintEnabled(e.target.checked)}
          />
          Hints enabled
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={saveSettings}
          className="px-4 py-2 rounded-lg bg-zinc-600 hover:bg-zinc-500 text-sm"
        >
          Save settings
        </button>
        <button
          onClick={onStartGame}
          disabled={!canStart}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-medium"
        >
          Start game
        </button>
      </div>
    </div>
  );
}
