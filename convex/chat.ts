import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Save a chat message */
export const saveMessage = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { userId, role, content }) => {
    await ctx.db.insert("chatMessages", {
      userId,
      role,
      content,
      createdAt: Date.now(),
    });
  },
});

/** Get chat history for a user (last 20 messages) */
export const getChatHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
    return messages.reverse(); // oldest first
  },
});

/** Clear chat history */
export const clearChatHistory = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
  },
});
