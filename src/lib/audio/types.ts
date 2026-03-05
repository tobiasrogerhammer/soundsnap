export interface AudioService {
  getPreviewUrl(songId: string, startTimeSec: number): Promise<string>;
  preload(url: string): void;
  play(url: string, startTimeSec: number): Promise<void>;
  stop(): void;
}
