import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Create a new user account */
export const createUser = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing account
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      password,
      createdAt: Date.now(),
    });

    // Initialize progress
    await ctx.db.insert("progress", {
      userId,
      completedLessons: [],
      totalScore: 0,
      streak: 0,
      lastAccess: undefined,
      energy: 20,
      coins: 0,
      lastEnergyRefill: Date.now(),
    });

    return { userId, email: normalizedEmail };
  },
});

/** Validate credentials and return user session data */
export const loginUser = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!user || user.password !== password) {
      throw new Error("Invalid email or password.");
    }

    return { userId: user._id, email: user.email };
  },
});

/** Get user by ID */
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});
