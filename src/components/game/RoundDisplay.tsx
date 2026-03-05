"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { usePreviewPlayer } from "@/lib/audio/usePreviewPlayer";
import { useEffect, useState } from "react";
import { QuestionCard } from "./QuestionCard";

type Song = {
  _id: Id<"songs">;
  title: string;
  artist: string;
  year: number;
  streamCount: number;
  genre: string[];
} | null;

type Round = {
  _id: Id<"rounds">;
  roomId: Id<"rooms">;
  roundIndex: number;
  songId: Id<"songs">;
  previewStartTimeSec: number;
  questionType: string;
  correctAnswer: unknown;
  phase: "preview" | "answering" | "reveal";
  startedAt: number;
  phaseEndsAt?: number;
};

export type { Round };

type Player = { _id: string; name: string; userId?: string };

export function RoundDisplay({
  roomId,
  roomCode,
  round,
  players,
  isHost,
}: {
  roomId: Id<"rooms">;
  roomCode: string;
  round: Round | null | undefined;
  players: Player[];
  isHost: boolean;
}) {
  void roomCode;
  void players;
  const song = useQuery(
    api.songs.get,
    round?.songId ? { id: round.songId } : "skip"
  );
  const answers = useQuery(
    api.roundAnswers.listByRound,
    round?._id ? { roundId: round._id } : "skip"
  );
  const advancePhase = useMutation(api.rounds.advancePhase);
  const endRoundAndAdvance = useMutation(api.rounds.endRoundAndAdvance);
  const { playPreview, stop, isPlaying } = usePreviewPlayer();
  const [previewPlayed, setPreviewPlayed] = useState(false);

  useEffect(() => {
    if (round?.phase === "preview" && song && !previewPlayed) {
      setPreviewPlayed(true);
      playPreview(round.songId, round.previewStartTimeSec);
      const t = setTimeout(() => {
        stop();
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [round?.phase, round?.songId, round?.previewStartTimeSec, song, previewPlayed, playPreview, stop]);

  if (!round) {
    return <p className="text-zinc-500">Loading round…</p>;
  }

  if (round.phase === "preview") {
    return (
      <div className="text-center space-y-4">
        <p className="text-zinc-400">Listen to the preview…</p>
        {isPlaying && (
          <p className="text-sm text-emerald-500">Playing…</p>
        )}
        {isHost && (
          <button
            onClick={() => advancePhase({ roomId })}
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium"
          >
            Start question
          </button>
        )}
      </div>
    );
  }

  if (round.phase === "answering") {
    return (
      <QuestionCard
        roundId={round._id}
        questionType={round.questionType}
        song={song as Song}
        correctAnswer={round.correctAnswer}
        onAdvancePhase={() => advancePhase({ roomId })}
      />
    );
  }

  if (round.phase === "reveal") {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <h3 className="text-sm font-medium text-zinc-400 mb-2">Round result</h3>
          {song && (
            <p className="text-lg font-medium">
              {(song as NonNullable<Song>).title} – {(song as NonNullable<Song>).artist} ({(song as NonNullable<Song>).year})
            </p>
          )}
        </div>
        {answers && answers.length > 0 && (
          <ul className="space-y-2">
            {(answers as { _id: string; name: string; pointsAwarded: number }[]).map((a) => (
              <li
                key={a._id}
                className="flex justify-between text-sm px-3 py-2 rounded bg-zinc-800"
              >
                <span>{a.name}</span>
                <span className={a.pointsAwarded > 0 ? "text-emerald-400" : "text-zinc-500"}>
                  {a.pointsAwarded > 0 ? `+${a.pointsAwarded}` : a.pointsAwarded}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-zinc-500 text-sm text-center">
          Host: click &quot;Next round&quot; when ready.
        </p>
        {isHost && (
        <div className="flex justify-center">
          <button
            onClick={() => endRoundAndAdvance({ roomId })}
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium"
          >
            Next round
          </button>
        </div>
        )}
      </div>
    );
  }

  return null;
}
