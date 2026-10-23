"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { LobbySettings } from "@/components/lobby/LobbySettings";
import { PlayerList } from "@/components/lobby/PlayerList";

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const room = useQuery(api.rooms.get, { roomCode });
  const leaveMutation = useMutation(api.rooms.leave);
  const joinMutation = useMutation(api.rooms.join);
  const setReadyMutation = useMutation(api.rooms.setReady);
  const startGameMutation = useMutation(api.rooms.startGame);
  useUser();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const players = useQuery(
    api.roomPlayers.listByRoom,
    room?._id ? { roomId: room._id } : "skip"
  );
  const me = useQuery(api.users.getMe, {});

  const isHost = !!room && !!me && room.hostId === me._id;
  const amInRoom = !!players?.some((p) => p.userId === me?._id);

  useEffect(() => {
    if (room?.status === "playing") {
      router.replace(`/game/${roomCode}`);
    }
  }, [room?.status, roomCode, router]);

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
    if (!room?._id) return;
    try {
      await leaveMutation({ roomId: room._id });
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to leave");
    }
  }

  async function handleSetReady(ready: boolean) {
    if (!room?._id) return;
    try {
      await setReadyMutation({ roomId: room._id, ready });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set ready");
    }
  }

  async function handleStartGame() {
    if (!room?._id) return;
    setError(null);
    try {
      await startGameMutation({ roomId: room._id });
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

  if (room === null) {
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

  const canStart = room.status === "lobby" && players && players.length >= 2;
  const myPlayer = players?.find((p) => p.userId === me?._id);

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
        players={players ?? []}
        currentUserName={me?.name ?? "Player"}
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
          <LobbySettings
            roomId={room._id}
            gameSettings={room.gameSettings}
            onStartGame={handleStartGame}
            canStart={!!canStart}
          />
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
