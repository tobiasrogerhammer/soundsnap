import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireHost } from "./lib/auth";
import {
  scoreAnswer,
  pickSong,
  pickQuestionType,
  buildCorrectAnswer,
} from "./lib/gameEngine";

export const getCurrentRound = query({
  args: { roomId: v.id("rooms") },
  returns: v.union(
    v.object({
      _id: v.id("rounds"),
      _creationTime: v.number(),
      roomId: v.id("rooms"),
      roundIndex: v.number(),
      songId: v.id("songs"),
      previewStartTimeSec: v.number(),
      questionType: v.string(),
      correctAnswer: v.any(),
      modifier: v.optional(v.string()),
      phase: v.union(
        v.literal("preview"),
        v.literal("answering"),
        v.literal("reveal")
      ),
      startedAt: v.number(),
      phaseEndsAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;
    const round = await ctx.db
      .query("rounds")
      .withIndex("by_room_and_index", (q) =>
        q.eq("roomId", args.roomId).eq("roundIndex", room.currentRoundIndex)
      )
      .unique();
    return round;
  },
});

export const advancePhase = mutation({
  args: { roomId: v.id("rooms") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireHost(ctx, args.roomId);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    const round = await ctx.db
      .query("rounds")
      .withIndex("by_room_and_index", (q) =>
        q.eq("roomId", args.roomId).eq("roundIndex", room.currentRoundIndex)
      )
      .unique();
    if (!round) throw new Error("Round not found");
    const now = Date.now();
    if (round.phase === "preview") {
      await ctx.db.patch(round._id, {
        phase: "answering",
        phaseEndsAt: now + 15000,
      });
    } else if (round.phase === "answering") {
      await ctx.db.patch(round._id, { phase: "reveal" });
    }
    return null;
  },
});

export const endRoundAndAdvance = mutation({
  args: { roomId: v.id("rooms") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireHost(ctx, args.roomId);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    const round = await ctx.db
      .query("rounds")
      .withIndex("by_room_and_index", (q) =>
        q.eq("roomId", args.roomId).eq("roundIndex", room.currentRoundIndex)
      )
      .unique();
    if (!round) throw new Error("Round not found");
    if (round.phase !== "reveal") throw new Error("Round not in reveal phase");
    const answers = await ctx.db
      .query("roundAnswers")
      .withIndex("by_round", (q) => q.eq("roundId", round._id))
      .collect();
    const basePoints = 100;
    for (const a of answers) {
      const points = scoreAnswer(
        round.questionType,
        round.correctAnswer as Record<string, unknown>,
        a.answer,
        round.modifier,
        basePoints
      );
      await ctx.db.patch(a._id, { pointsAwarded: points });
      const rp = await ctx.db
        .query("roomPlayers")
        .withIndex("by_room_and_user", (q) =>
          q.eq("roomId", args.roomId).eq("userId", a.userId)
        )
        .unique();
      if (rp) {
        await ctx.db.patch(rp._id, { score: rp.score + points });
      }
    }
    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    const maxPoints = room.gameSettings.maxPoints;
    const winner = players.find((p) => p.score >= maxPoints);
    if (winner) {
      await ctx.db.patch(args.roomId, { status: "finished" });
      return null;
    }
    const nextIndex = room.currentRoundIndex + 1;
    await ctx.db.patch(args.roomId, { currentRoundIndex: nextIndex });
    const songId = await pickSong(ctx, room.gameSettings.selectedGenres);
    const song = await ctx.db.get(songId);
    if (!song) {
      await ctx.db.patch(args.roomId, { status: "finished" });
      return null;
    }
    const questionType = pickQuestionType(song);
    const correctAnswer = buildCorrectAnswer(song, questionType);
    const startedAt = Date.now();
    await ctx.db.insert("rounds", {
      roomId: args.roomId,
      roundIndex: nextIndex,
      songId,
      previewStartTimeSec: Math.floor(Math.random() * 28),
      questionType,
      correctAnswer,
      phase: "preview",
      startedAt,
    });
    return null;
  },
});
