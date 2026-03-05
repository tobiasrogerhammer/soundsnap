import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireRoomMember } from "./lib/auth";

export const submit = mutation({
  args: {
    roundId: v.id("rounds"),
    answer: v.union(v.string(), v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");
    if (round.phase !== "answering") throw new Error("Not in answering phase");
    await requireRoomMember(ctx, round.roomId);
    const existing = await ctx.db
      .query("roundAnswers")
      .withIndex("by_round_and_user", (q) =>
        q.eq("roundId", args.roundId).eq("userId", user._id)
      )
      .unique();
    if (existing) return null;
    await ctx.db.insert("roundAnswers", {
      roundId: args.roundId,
      userId: user._id,
      answer: args.answer,
      pointsAwarded: 0,
      answeredAt: Date.now(),
    });
    return null;
  },
});

export const listByRound = query({
  args: { roundId: v.id("rounds") },
  returns: v.array(
    v.object({
      _id: v.id("roundAnswers"),
      _creationTime: v.number(),
      roundId: v.id("rounds"),
      userId: v.id("users"),
      answer: v.union(v.string(), v.number()),
      pointsAwarded: v.number(),
      answeredAt: v.number(),
      name: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const answers = await ctx.db
      .query("roundAnswers")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();
    const withNames = await Promise.all(
      answers.map(async (a) => {
        const u = await ctx.db.get(a.userId);
        return { ...a, name: u?.name ?? "Unknown" };
      })
    );
    return withNames;
  },
});
