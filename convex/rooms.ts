import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireHost } from "./lib/auth";
import {
  generateRoomCode,
  pickStartingPlayer,
  pickSong,
  pickQuestionType,
  buildCorrectAnswer,
} from "./lib/gameEngine";

const gameSettingsValidator = v.object({
  gameMode: v.union(v.literal("solo"), v.literal("teams")),
  maxPoints: v.number(),
  selectedGenres: v.array(v.string()),
  modifiers: v.optional(
    v.object({
      doublePointsRounds: v.optional(v.boolean()),
      losePointsRounds: v.optional(v.boolean()),
      extraAudioCost: v.optional(v.number()),
      hintEnabled: v.optional(v.boolean()),
    })
  ),
});

const defaultGameSettings = {
  gameMode: "solo" as const,
  maxPoints: 10,
  selectedGenres: [] as string[],
  modifiers: {},
};

export const create = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    let code = generateRoomCode();
    for (let i = 0; i < 10; i++) {
      const existing = await ctx.db
        .query("rooms")
        .withIndex("by_roomCode", (q) => q.eq("roomCode", code))
        .unique();
      if (!existing) break;
      code = generateRoomCode();
    }
    const roomId = await ctx.db.insert("rooms", {
      hostId: user._id,
      roomCode: code,
      status: "lobby",
      gameSettings: defaultGameSettings,
      currentRoundIndex: 0,
      createdAt: Date.now(),
    });
    await ctx.db.insert("roomPlayers", {
      roomId,
      userId: user._id,
      ready: true,
      score: 0,
      joinedAt: Date.now(),
    });
    await ctx.db.patch(user._id, { currentRoomId: roomId });
    return code;
  },
});

export const get = query({
  args: { roomCode: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("rooms"),
      _creationTime: v.number(),
      hostId: v.id("users"),
      roomCode: v.string(),
      status: v.union(
        v.literal("lobby"),
        v.literal("playing"),
        v.literal("finished")
      ),
      gameSettings: gameSettingsValidator,
      currentRoundIndex: v.number(),
      spinResultPlayerId: v.optional(v.id("users")),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode))
      .unique();
    return room;
  },
});

export const join = mutation({
  args: {
    roomCode: v.string(),
    teamId: v.optional(v.id("teams")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode))
      .unique();
    if (!room) throw new Error("Room not found");
    if (room.status !== "lobby") throw new Error("Game already started");
    const existing = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", room._id).eq("userId", user._id)
      )
      .unique();
    if (existing) return null;
    await ctx.db.insert("roomPlayers", {
      roomId: room._id,
      userId: user._id,
      teamId: args.teamId,
      ready: false,
      score: 0,
      joinedAt: Date.now(),
    });
    await ctx.db.patch(user._id, { currentRoomId: room._id });
    return null;
  },
});

export const leave = mutation({
  args: { roomId: v.id("rooms") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    const membership = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .unique();
    if (!membership) return null;
    await ctx.db.delete(membership._id);
    await ctx.db.patch(user._id, { currentRoomId: undefined });
    const remaining = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    if (room.hostId === user._id && remaining.length > 0) {
      await ctx.db.patch(args.roomId, { hostId: remaining[0].userId });
    } else if (room.hostId === user._id && remaining.length === 0) {
      await ctx.db.patch(args.roomId, { status: "finished" });
    }
    return null;
  },
});

export const updateSettings = mutation({
  args: {
    roomId: v.id("rooms"),
    gameSettings: gameSettingsValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireHost(ctx, args.roomId);
    await ctx.db.patch(args.roomId, {
      gameSettings: args.gameSettings,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const setReady = mutation({
  args: { roomId: v.id("rooms"), ready: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const membership = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .unique();
    if (!membership) throw new Error("Not in this room");
    await ctx.db.patch(membership._id, { ready: args.ready });
    return null;
  },
});

export const startGame = mutation({
  args: { roomId: v.id("rooms") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireHost(ctx, args.roomId);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.status !== "lobby") throw new Error("Game already started");
    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    if (players.length < 2) throw new Error("Need at least 2 players");
    const songId = await pickSong(ctx, room.gameSettings.selectedGenres);
    const song = await ctx.db.get(songId);
    if (!song) throw new Error("Song not found");
    const questionType = pickQuestionType(song);
    const correctAnswer = buildCorrectAnswer(song, questionType);
    const startedAt = Date.now();
    await ctx.db.insert("rounds", {
      roomId: args.roomId,
      roundIndex: 0,
      songId,
      previewStartTimeSec: Math.floor(Math.random() * 28),
      questionType,
      correctAnswer,
      phase: "preview",
      startedAt,
    });
    const playerIds = players.map((p) => p.userId);
    const spinResultPlayerId = pickStartingPlayer(playerIds, startedAt);
    await ctx.db.patch(args.roomId, {
      status: "playing",
      spinResultPlayerId,
      updatedAt: startedAt,
    });
    return null;
  },
});
