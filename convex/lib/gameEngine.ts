import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function pickStartingPlayer(
  playerIds: Id<"users">[],
  seed: number
): Id<"users"> {
  if (playerIds.length === 0) throw new Error("No players");
  const idx = Math.abs(seed % playerIds.length);
  return playerIds[idx];
}

export async function pickSong(
  ctx: QueryCtx,
  genres: string[]
): Promise<Id<"songs">> {
  const all = await ctx.db.query("songs").collect();
  const filtered =
    genres.length === 0
      ? all
      : all.filter((s) => s.genre.some((g) => genres.includes(g)));
  if (filtered.length === 0) {
    throw new Error("No songs available for selected genres");
  }
  const idx = Math.floor(Math.random() * filtered.length);
  return filtered[idx]._id;
}

const QUESTION_TYPES = [
  "artist",
  "year",
  "songAbout",
  "streamCount",
] as const;
const QUESTION_TYPES_WITH_ORIGINAL = [
  "artist",
  "year",
  "songAbout",
  "streamCount",
  "identifyOriginal",
] as const;

export function pickQuestionType(
  song: Doc<"songs">
): (typeof QUESTION_TYPES_WITH_ORIGINAL)[number] {
  const types = song.isCover ? QUESTION_TYPES_WITH_ORIGINAL : QUESTION_TYPES;
  return types[Math.floor(Math.random() * types.length)];
}

export function buildCorrectAnswer(
  song: Doc<"songs">,
  questionType: (typeof QUESTION_TYPES_WITH_ORIGINAL)[number]
):
  | { artist: string }
  | { year: number }
  | { choiceIndex: number }
  | { streams: number }
  | { originalSongId: string } {
  switch (questionType) {
    case "artist":
      return { artist: song.artist };
    case "year":
      return { year: song.year };
    case "songAbout":
      return { choiceIndex: 0 };
    case "streamCount":
      return { streams: song.streamCount };
    case "identifyOriginal":
      return {
        originalSongId: song.originalSongId
          ? String(song.originalSongId)
          : String(song._id),
      };
    default:
      return { artist: song.artist };
  }
}

export function scoreAnswer(
  questionType: string,
  correctAnswer: Record<string, unknown>,
  userAnswer: string | number,
  modifier: string | undefined,
  basePoints: number
): number {
  let points = 0;
  if (questionType === "artist" && "artist" in correctAnswer) {
    points =
      String(userAnswer).trim().toLowerCase() ===
      String(correctAnswer.artist).toLowerCase()
        ? basePoints
        : 0;
  } else if (questionType === "year" && "year" in correctAnswer) {
    points =
      Number(userAnswer) === Number(correctAnswer.year) ? basePoints : 0;
  } else if (questionType === "songAbout" && "choiceIndex" in correctAnswer) {
    points =
      Number(userAnswer) === Number(correctAnswer.choiceIndex) ? basePoints : 0;
  } else if (questionType === "streamCount" && "streams" in correctAnswer) {
    const correct = Number(correctAnswer.streams);
    const answer = Number(userAnswer);
    const distance = Math.abs(correct - answer);
    const maxDistance = Math.max(correct * 0.5, 1);
    points = Math.max(0, Math.round(basePoints * (1 - distance / maxDistance)));
  } else if (
    questionType === "identifyOriginal" &&
    "originalSongId" in correctAnswer
  ) {
    points =
      String(userAnswer) === String(correctAnswer.originalSongId)
        ? basePoints
        : 0;
  }

  if (modifier === "double") {
    points *= 2;
  } else if (modifier === "lose") {
    points = -points;
  }
  return points;
}

export { generateRoomCode };
