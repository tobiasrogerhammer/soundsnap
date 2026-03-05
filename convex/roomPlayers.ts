import { query } from "./_generated/server";
import { v } from "convex/values";

export const listByRoom = query({
  args: { roomId: v.id("rooms") },
  returns: v.array(
    v.object({
      _id: v.id("roomPlayers"),
      _creationTime: v.number(),
      roomId: v.id("rooms"),
      userId: v.id("users"),
      teamId: v.optional(v.id("teams")),
      ready: v.boolean(),
      score: v.number(),
      joinedAt: v.number(),
      name: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    const withNames = await Promise.all(
      players.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return {
          ...p,
          name: user?.name ?? "Unknown",
        };
      })
    );
    return withNames;
  },
});
