import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(), // stored as plain string (demo app)
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  progress: defineTable({
    userId: v.id("users"),
    completedLessons: v.array(v.number()), // array of lesson IDs
    totalScore: v.number(),
    streak: v.number(),
    lastAccess: v.optional(v.number()),
    energy: v.number(),
    coins: v.number(),
    lastEnergyRefill: v.number(),
  }).index("by_userId", ["userId"]),

  lessons: defineTable({
    lessonId: v.number(), // 1-21
    title: v.string(),
    category: v.string(),
    content: v.string(),
    dayNumber: v.number(),
  }).index("by_lessonId", ["lessonId"]),

  quizzes: defineTable({
    lessonId: v.number(),
    question: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.string(),
  }).index("by_lessonId", ["lessonId"]),

  chatMessages: defineTable({
    userId: v.id("users"),
    role: v.string(), // "user" | "ai"
    content: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
});
