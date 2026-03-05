"use client";

import { useState, useCallback } from "react";
import { audioService } from "./AudioService";
import type { Id } from "../../../convex/_generated/dataModel";

export function usePreviewPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  const playPreview = useCallback(
    async (songId: Id<"songs">, startTimeSec: number) => {
      const url = await audioService.getPreviewUrl(songId, startTimeSec);
      if (url) {
        setIsPlaying(true);
        await audioService.play(url, startTimeSec);
      }
    },
    []
  );

  const stop = useCallback(() => {
    audioService.stop();
    setIsPlaying(false);
  }, []);

  return { playPreview, stop, isPlaying };
}
