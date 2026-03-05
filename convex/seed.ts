import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seedSongs = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("songs").first();
    if (existing) return null;
    await ctx.db.insert("songs", {
      title: "Blinding Lights",
      artist: "The Weeknd",
      year: 2020,
      genre: ["Pop", "2000s"],
      streamCount: 3_500_000_000,
      isCover: false,
      previewUrl: undefined,
    });
    await ctx.db.insert("songs", {
      title: "Shape of You",
      artist: "Ed Sheeran",
      year: 2017,
      genre: ["Pop", "2000s"],
      streamCount: 3_400_000_000,
      isCover: false,
      previewUrl: undefined,
    });
    await ctx.db.insert("songs", {
      title: "Someone Like You",
      artist: "Adele",
      year: 2011,
      genre: ["Pop", "2000s"],
      streamCount: 1_500_000_000,
      isCover: false,
      previewUrl: undefined,
    });
    await ctx.db.insert("songs", {
      title: "Take On Me",
      artist: "a-ha",
      year: 1985,
      genre: ["Pop", "80s"],
      streamCount: 1_200_000_000,
      isCover: false,
      previewUrl: undefined,
    });
    await ctx.db.insert("songs", {
      title: "Hurt",
      artist: "Johnny Cash",
      year: 2002,
      genre: ["Country", "2000s"],
      streamCount: 200_000_000,
      isCover: true,
      previewUrl: undefined,
    });
    return null;
  },
});
