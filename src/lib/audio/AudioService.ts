import type { Id } from "../../../convex/_generated/dataModel";

class AudioServiceImpl {
  private audio: HTMLAudioElement | null = null;

  async getPreviewUrl(
    songId: Id<"songs"> | string,
    startTimeSec: number
  ): Promise<string> {
    void songId;
    void startTimeSec;
    return "";
  }

  preload(url: string): void {
    void url;
  }

  async play(url: string, startTimeSec: number): Promise<void> {
    if (!url) return;
    this.stop();
    this.audio = new Audio(url);
    this.audio.currentTime = startTimeSec;
    await this.audio.play();
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }
}

export const audioService = new AudioServiceImpl();
