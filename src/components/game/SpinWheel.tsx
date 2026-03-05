"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

interface Player {
  userId: string;
  name: string;
}

export function SpinWheel({
  players,
  resultPlayerId,
  onComplete,
}: {
  players: Player[];
  resultPlayerId: string;
  onComplete: () => void;
}) {
  const controls = useAnimation();
  const [started, setStarted] = useState(false);

  const index = players.findIndex((p) => p.userId === resultPlayerId);
  const segmentAngle = 360 / Math.max(1, players.length);
  const fullSpins = 5;
  const finalSegmentOffset = index >= 0 ? index * segmentAngle : 0;
  const finalRotation = fullSpins * 360 + (360 - finalSegmentOffset);

  useEffect(() => {
    if (players.length === 0 || started) return;
    setStarted(true);
    controls
      .start({
        rotate: finalRotation,
        transition: {
          duration: 4,
          ease: [0.2, 0.8, 0.2, 1],
        },
      })
      .then(() => {
        setTimeout(onComplete, 800);
      });
  }, [players.length, finalRotation, controls, onComplete, started]);

  if (players.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-zinc-400 text-sm">Spinning to choose first player…</p>
      <div className="relative">
        <div
          className="absolute left-1/2 -top-2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-red-500 -translate-x-1/2 z-10"
          style={{ transform: "translateX(-50%)" }}
        />
        <motion.div
          className="w-64 h-64 rounded-full border-4 border-zinc-600 bg-zinc-800 flex items-center justify-center"
          style={{
            background: `conic-gradient(${players
              .map(
                (_, i) =>
                  `hsl(${200 + i * 40}, 60%, 35%) ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
              )
              .join(", ")})`,
            boxShadow: "inset 0 0 0 4px #27272a",
          }}
          initial={{ rotate: 0 }}
          animate={controls}
        >
          <div className="w-48 h-48 rounded-full bg-zinc-900 border-2 border-zinc-600 flex items-center justify-center text-zinc-400 text-sm font-medium">
            SoundSnap
          </div>
        </motion.div>
      </div>
      <p className="text-zinc-500 text-xs">
        {index >= 0 ? players[index].name : "—"} goes first!
      </p>
    </div>
  );
}
