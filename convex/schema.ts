import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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

const correctAnswerValidator = v.union(
  v.object({ artist: v.string() }),
  v.object({ year: v.number() }),
  v.object({ choiceIndex: v.number() }),
  v.object({ streams: v.number() }),
  v.object({ originalSongId: v.string() })
);

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    currentRoomId: v.optional(v.id("rooms")),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_currentRoom", ["currentRoomId"]),

  rooms: defineTable({
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
  })
    .index("by_roomCode", ["roomCode"])
    .index("by_host", ["hostId"])
    .index("by_status", ["status"]),

  roomPlayers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    teamId: v.optional(v.id("teams")),
    ready: v.boolean(),
    score: v.number(),
    joinedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"]),

  teams: defineTable({
    roomId: v.id("rooms"),
    name: v.string(),
  }).index("by_room", ["roomId"]),

  rounds: defineTable({
    roomId: v.id("rooms"),
    roundIndex: v.number(),
    songId: v.id("songs"),
    previewStartTimeSec: v.number(),
    questionType: v.union(
      v.literal("artist"),
      v.literal("year"),
      v.literal("songAbout"),
      v.literal("streamCount"),
      v.literal("identifyOriginal")
    ),
    correctAnswer: correctAnswerValidator,
    modifier: v.optional(v.string()),
    phase: v.union(
      v.literal("preview"),
      v.literal("answering"),
      v.literal("reveal")
    ),
    startedAt: v.number(),
    phaseEndsAt: v.optional(v.number()),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_index", ["roomId", "roundIndex"]),

  roundAnswers: defineTable({
    roundId: v.id("rounds"),
    userId: v.id("users"),
    answer: v.union(v.string(), v.number()),
    pointsAwarded: v.number(),
    answeredAt: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_round_and_user", ["roundId", "userId"]),

  songs: defineTable({
    title: v.string(),
    artist: v.string(),
    year: v.number(),
    genre: v.array(v.string()),
    streamCount: v.number(),
    isCover: v.boolean(),
    originalSongId: v.optional(v.id("songs")),
    previewUrl: v.optional(v.string()),
  }),
});
