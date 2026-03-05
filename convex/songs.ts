import { query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("songs") },
  returns: v.union(
    v.object({
      _id: v.id("songs"),
      _creationTime: v.number(),
      title: v.string(),
      artist: v.string(),
      year: v.number(),
      genre: v.array(v.string()),
      streamCount: v.number(),
      isCover: v.boolean(),
      originalSongId: v.optional(v.id("songs")),
      previewUrl: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
