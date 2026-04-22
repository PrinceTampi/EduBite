import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_ENERGY = 25;
const ENERGY_PER_LESSON = 3; // cost to start a lesson
const ENERGY_RESTORE_ON_COMPLETE = 1; // restored after finishing quiz

/** Get progress for a user */
export const getProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("progress")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

/** Update progress after completing a quiz */
export const updateProgress = mutation({
  args: {
    userId: v.id("users"),
    lessonId: v.number(),
    score: v.number(),
    total: v.number(),
  },
  handler: async (ctx, { userId, lessonId, score, total }) => {
    let progress = await ctx.db
      .query("progress")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!progress) {
      const newId = await ctx.db.insert("progress", {
        userId,
        completedLessons: [],
        totalScore: 0,
        streak: 0,
        lastAccess: undefined,
        energy: 20,
        coins: 0,
        lastEnergyRefill: Date.now(),
      });
      progress = (await ctx.db.get(newId))!;
    }

    if (!progress) throw new Error("Progress could not be created");

    const now = Date.now();

    // Add lesson to completed (no duplicates)
    const completedLessons = progress.completedLessons.includes(lessonId)
      ? progress.completedLessons
      : [...progress.completedLessons, lessonId];

    // Score
    const newTotalScore = progress.totalScore + score;

    // Coins
    const percent = Math.round((score / total) * 100);
    let coinsEarned = 2;
    if (percent === 100) coinsEarned = 10;
    else if (percent >= 60) coinsEarned = 5;
    const newCoins = (progress.coins || 0) + coinsEarned;

    // Energy restore
    const newEnergy = Math.min(MAX_ENERGY, (progress.energy || 0) + ENERGY_RESTORE_ON_COMPLETE);

    // Streak
    let newStreak = progress.streak;
    const lastAccess = progress.lastAccess;
    if (lastAccess) {
      const lastDate = new Date(lastAccess);
      const today = new Date();
      const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffDays = (todayDay.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 0) {
        // Same day — streak unchanged
      } else if (diffDays === 1) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await ctx.db.patch(progress._id, {
      completedLessons,
      totalScore: newTotalScore,
      coins: newCoins,
      energy: newEnergy,
      streak: newStreak,
      lastAccess: now,
    });

    return { coinsEarned, newStreak, newEnergy };
  },
});

/** Consume energy when starting a lesson */
export const consumeEnergy = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    let progress = await ctx.db
      .query("progress")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!progress) {
      const newId = await ctx.db.insert("progress", {
        userId,
        completedLessons: [],
        totalScore: 0,
        streak: 0,
        lastAccess: undefined,
        energy: 20,
        coins: 0,
        lastEnergyRefill: Date.now(),
      });
      progress = (await ctx.db.get(newId))!;
    }

    if (!progress) return { success: false, reason: "PROGRESS_NOT_FOUND" };
    if ((progress.energy || 0) < ENERGY_PER_LESSON) {
      return { success: false, reason: "NOT_ENOUGH_ENERGY" };
    }

    await ctx.db.patch(progress._id, {
      energy: progress.energy - ENERGY_PER_LESSON,
    });
    return { success: true, newEnergy: progress.energy - ENERGY_PER_LESSON };
  },
});

/** Regenerate energy based on elapsed time (call on app open) */
export const regenerateEnergy = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    let progress = await ctx.db
      .query("progress")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!progress) {
      const newId = await ctx.db.insert("progress", {
        userId,
        completedLessons: [],
        totalScore: 0,
        streak: 0,
        lastAccess: undefined,
        energy: 20,
        coins: 0,
        lastEnergyRefill: Date.now(),
      });
      progress = await ctx.db.get(newId);
    }

    if (!progress) return;
    if ((progress.energy || 0) >= MAX_ENERGY) return;

    const REGEN_MS = 10 * 60 * 1000; // 10 minutes per 1 energy
    const elapsed = Date.now() - (progress.lastEnergyRefill || Date.now());
    const gained = Math.floor(elapsed / REGEN_MS);

    if (gained > 0) {
      const newEnergy = Math.min(MAX_ENERGY, (progress.energy || 0) + gained);
      await ctx.db.patch(progress._id, {
        energy: newEnergy,
        lastEnergyRefill: Date.now(),
      });
    }
  },
});
