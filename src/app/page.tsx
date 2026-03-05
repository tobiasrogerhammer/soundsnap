"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useUser, Show } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import Link from "next/link";

export default function HomePage() {
  const [roomCode, setRoomCode] = useState("");
  const createRoom = useMutation(api.rooms.create);
  const ensureUser = useMutation(api.users.ensure);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    void ensureUser({ name: user.firstName ?? user.username ?? "Player" }).then(
      (res) => {
        if (res && typeof res === "object" && "ok" in res && res.ok === false) {
          // Convex not wired to Clerk yet; no console error
        }
      }
    );
  }, [isLoaded, user, ensureUser]);

  async function handleCreateGame() {
    setLoading(true);
    setError(null);
    try {
      const ensureResult = await ensureUser({
        name: user?.firstName ?? user?.username ?? "Player",
      });
      if (
        ensureResult &&
        typeof ensureResult === "object" &&
        "ok" in ensureResult &&
        ensureResult.ok === false
      ) {
        setError(
          "Auth not linked. Add Clerk JWT template \"convex\" and set CLERK_JWT_ISSUER_DOMAIN in Convex."
        );
        return;
      }
      const code = await createRoom({});
      window.location.href = `/lobby/${code}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create game");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-2">SoundSnap</h1>
      <p className="text-zinc-400 mb-8">Real-time multiplayer music quiz</p>

      <Show when="signed-out">
        <p className="text-zinc-500 text-sm text-center max-w-sm">
          Use the Sign in or Sign up button above to create or join a game.
        </p>
      </Show>

      <Show when="signed-in">
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button
            onClick={handleCreateGame}
            disabled={loading}
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-medium"
          >
            {loading ? "Creating…" : "Create game"}
          </button>

          <div className="relative my-2">
            <span className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-700" />
            </span>
            <span className="relative flex justify-center text-sm text-zinc-500">
              or join with code
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-center font-mono text-lg tracking-widest uppercase"
              maxLength={6}
            />
            <Link
              href={roomCode.length === 6 ? `/lobby/${roomCode}` : "#"}
              className={`px-6 py-3 rounded-lg font-medium shrink-0 ${
                roomCode.length === 6
                  ? "bg-zinc-600 hover:bg-zinc-500"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed pointer-events-none"
              }`}
            >
              Join
            </Link>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </Show>
    </main>
  );
}
