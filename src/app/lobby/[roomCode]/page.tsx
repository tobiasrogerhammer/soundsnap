"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import { LobbySettings } from "@/components/lobby/LobbySettings";
import { PlayerList } from "@/components/lobby/PlayerList";

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const room = useQuery(api.rooms.get, { roomCode });
  const roomData = room as {
    _id: string;
    status: string;
    hostId: string;
    gameSettings: { gameMode: string; maxPoints: number; selectedGenres: string[]; modifiers?: Record<string, unknown> };
  } | null;
  const leaveMutation = useMutation(api.rooms.leave);
  const joinMutation = useMutation(api.rooms.join);
  const setReadyMutation = useMutation(api.rooms.setReady);
  const startGameMutation = useMutation(api.rooms.startGame);
  useUser();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const players = useQuery(
    api.roomPlayers.listByRoom,
    roomData?._id ? { roomId: roomData._id } : "skip"
  );
  const me = useQuery(api.users.getMe, {});

  const isHost = roomData && me && roomData.hostId === (me as { _id: string })._id;
  const amInRoom = !!players?.some((p) => (p as { userId: string }).userId === (me as { _id: string })?._id);

  useEffect(() => {
    if (roomData?.status === "playing") {
      router.replace(`/game/${roomCode}`);
    }
  }, [roomData?.status, roomCode, router]);

  async function handleJoin() {
    if (!roomCode) return;
    setJoining(true);
    setError(null);
    try {
      await joinMutation({ roomCode });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave() {
    if (!roomData?._id) return;
    try {
      await leaveMutation({ roomId: roomData._id });
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to leave");
    }
  }

  async function handleSetReady(ready: boolean) {
    if (!roomData?._id) return;
    try {
      await setReadyMutation({ roomId: roomData._id, ready });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set ready");
    }
  }

  async function handleStartGame() {
    if (!roomData?._id) return;
    setError(null);
    try {
      await startGameMutation({ roomId: roomData._id });
      router.push(`/game/${roomCode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start game");
    }
  }

  if (room === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-zinc-500">Loading lobby…</p>
      </main>
    );
  }

  if (roomData === null) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-zinc-400">Room not found.</p>
        <Link href="/" className="text-emerald-500 hover:underline">
          Back home
        </Link>
      </main>
    );
  }

  if (!amInRoom) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-zinc-400">Join room {roomCode}?</p>
        <button
          onClick={handleJoin}
          disabled={joining}
          className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
        >
          {joining ? "Joining…" : "Join"}
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Link href="/" className="text-zinc-500 hover:underline text-sm">
          Back home
        </Link>
      </main>
    );
  }

  const canStart = roomData?.status === "lobby" && players && players.length >= 2;
  type PlayerItem = { userId: string; name: string; ready: boolean };
  const myPlayer = players?.find((p) => (p as PlayerItem).userId === (me as { _id: string })?._id) as PlayerItem | undefined;

  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lobby: {roomCode}</h1>
        <Link href="/" className="text-zinc-500 text-sm hover:underline">
          Home
        </Link>
      </div>

      {error && (
        <p className="mb-4 text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}

      <PlayerList
        players={(players ?? []) as { _id: string; name: string; ready: boolean; score: number }[]}
        currentUserName={(me as { name?: string })?.name ?? "Player"}
      />

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="text-zinc-500 text-sm">Ready?</span>
          <button
            onClick={() => handleSetReady(!myPlayer?.ready)}
            className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm"
          >
            {myPlayer?.ready ? "Not ready" : "Ready"}
          </button>
        </div>

        {isHost && (
          <>
            <LobbySettings
              roomId={roomData._id as Id<"rooms">}
              gameSettings={roomData.gameSettings as { gameMode: "solo" | "teams"; maxPoints: number; selectedGenres: string[]; modifiers?: { doublePointsRounds?: boolean; losePointsRounds?: boolean; hintEnabled?: boolean } }}
              onStartGame={handleStartGame}
              canStart={!!canStart}
            />
          </>
        )}

        <button
          onClick={handleLeave}
          className="px-4 py-2 rounded-lg border border-zinc-600 hover:bg-zinc-800 text-sm"
        >
          Leave
        </button>
      </div>
    </main>
  );
}
