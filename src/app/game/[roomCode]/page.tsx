"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SpinWheel } from "@/components/game/SpinWheel";
import { Scoreboard } from "@/components/shared/Scoreboard";
import { RoundDisplay } from "@/components/game/RoundDisplay";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const room = useQuery(api.rooms.get, { roomCode });
  const players = useQuery(
    api.roomPlayers.listByRoom,
    room?._id ? { roomId: room._id } : "skip"
  );
  const round = useQuery(
    api.rounds.getCurrentRound,
    room?._id ? { roomId: room._id } : "skip"
  );
  const me = useQuery(api.users.getMe, {});
  const [wheelDone, setWheelDone] = useState(false);

  const isHost = !!room && !!me && room.hostId === me._id;

  useEffect(() => {
    if (room?.status === "finished") {
      router.replace("/");
    }
  }, [room?.status, router]);

  if (room === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-zinc-500">Loading…</p>
      </main>
    );
  }

  if (room === null) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-zinc-500">Room not found.</p>
      </main>
    );
  }

  if (room.status === "lobby") {
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
    room.status === "playing" &&
    !!room.spinResultPlayerId &&
    round?.roundIndex === 0 &&
    round?.phase === "preview" &&
    !wheelDone;

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 font-mono">{roomCode}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-sm text-zinc-400">
            Round {room.currentRoundIndex + 1}
          </span>
        </div>
        <Link href="/" className="text-zinc-500 text-sm hover:underline">
          Home
        </Link>
      </div>

      <Scoreboard
        players={players ?? []}
        spinResultPlayerId={room.spinResultPlayerId}
      />

      <div className="flex-1 flex flex-col items-center justify-center py-8">
        {showWheel && players && room.spinResultPlayerId && (
          <SpinWheel
            players={players}
            resultPlayerId={room.spinResultPlayerId}
            onComplete={() => setWheelDone(true)}
          />
        )}
        {!showWheel && (
          <RoundDisplay
            roomId={room._id}
            roomCode={roomCode}
            round={round}
            players={players ?? []}
            isHost={isHost}
          />
        )}
      </div>
    </main>
  );
}
