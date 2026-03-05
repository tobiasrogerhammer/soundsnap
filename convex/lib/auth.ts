import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  if (!user) {
    throw new Error("User not found. Call users.ensure first.");
  }

  return user;
}

export async function requireRoomMember(
  ctx: QueryCtx | MutationCtx,
  roomId: Id<"rooms">
): Promise<Doc<"roomPlayers">> {
  const user = await getCurrentUser(ctx);
  const membership = await ctx.db
    .query("roomPlayers")
    .withIndex("by_room_and_user", (q) =>
      q.eq("roomId", roomId).eq("userId", user._id)
    )
    .unique();
  if (!membership) {
    throw new Error("Not a member of this room");
  }
  return membership;
}

export async function requireHost(
  ctx: QueryCtx | MutationCtx,
  roomId: Id<"rooms">
): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  const room = await ctx.db.get(roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  if (room.hostId !== user._id) {
    throw new Error("Only the host can do this");
  }
  return user;
}
