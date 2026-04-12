import { mutation } from "./_generated/server";

/** Seed the default demo user (test@edubite.com / 123456) - idempotent */
export const seedDemoUser = mutation({
  args: {},
  handler: async (ctx) => {
    const email = "test@edubite.com";
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) return { seeded: false };

    const userId = await ctx.db.insert("users", {
      email,
      password: "123456",
      createdAt: Date.now(),
    });

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

    return { seeded: true, userId };
  },
});
