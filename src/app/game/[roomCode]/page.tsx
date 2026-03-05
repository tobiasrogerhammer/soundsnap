"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SpinWheel } from "@/components/game/SpinWheel";
import { Scoreboard } from "@/components/shared/Scoreboard";
import { RoundDisplay, type Round } from "@/components/game/RoundDisplay";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const room = useQuery(api.rooms.get, { roomCode });
  const roomData = room as {
    _id: string;
    status: string;
    spinResultPlayerId?: string;
    currentRoundIndex: number;
    hostId: string;
  } | null;
  const players = useQuery(
    api.roomPlayers.listByRoom,
    roomData?._id ? { roomId: roomData._id } : "skip"
  );
  const round = useQuery(
    api.rounds.getCurrentRound,
    roomData?._id ? { roomId: roomData._id } : "skip"
  );
  const roundData = round as {
    roundIndex: number;
    phase: string;
    _id: string;
    songId: string;
    previewStartTimeSec: number;
    questionType: string;
    correctAnswer: unknown;
    phaseEndsAt?: number;
    startedAt: number;
    roomId: string;
  } | null | undefined;
  const me = useQuery(api.users.getMe, {});
  const [wheelDone, setWheelDone] = useState(false);

  const isHost = roomData && me && roomData.hostId === (me as { _id: string })._id;

  useEffect(() => {
    if (roomData?.status === "finished") {
      router.replace("/");
    }
  }, [roomData?.status, router]);

  if (room === undefined || roomData === null) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-zinc-500">Loading…</p>
      </main>
    );
  }

  if (roomData?.status === "lobby") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-zinc-400">Game has not started. Waiting in lobby.</p>
        <Link href={`/lobby/${roomCode}`} className="text-emerald-500 hover:underline">
          Back to lobby
        </Link>
      </main>
    );
  }

  const showWheel =
    roomData?.status === "playing" &&
    roomData?.spinResultPlayerId &&
    roundData?.roundIndex === 0 &&
    roundData?.phase === "preview" &&
    !wheelDone;

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 font-mono">{roomCode}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-sm text-zinc-400">
            Round {(roomData?.currentRoundIndex ?? 0) + 1}
          </span>
        </div>
        <Link href="/" className="text-zinc-500 text-sm hover:underline">
          Home
        </Link>
      </div>

      <Scoreboard
        players={(players ?? []) as { _id: string; name: string; score: number; userId?: string }[]}
        spinResultPlayerId={roomData?.spinResultPlayerId}
      />

      <div className="flex-1 flex flex-col items-center justify-center py-8">
        {showWheel && players && roomData?.spinResultPlayerId && (
          <SpinWheel
            players={players as { userId: string; name: string }[]}
            resultPlayerId={roomData.spinResultPlayerId}
            onComplete={() => setWheelDone(true)}
          />
        )}
        {!showWheel && roomData?._id && (
          <RoundDisplay
            roomId={roomData._id as Id<"rooms">}
            roomCode={roomCode}
            round={roundData as unknown as Round | null | undefined}
            players={(players ?? []) as { _id: string; name: string; userId?: string }[]}
            isHost={!!isHost}
          />
        )}
      </div>
    </main>
  );
}
