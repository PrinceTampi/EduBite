import { mutation, query, action } from "./_generated/server";
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
      .take(100);
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
  },
});


/** Generate AI Response via Grok AI (xAI) */
export const generateResponse = action({
  args: {
    message: v.string(),
    history: v.array(v.object({
      role: v.string(),
      content: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return "⚠️ Error: XAI_API_KEY is not configured in the server.";
    }

    const systemPrompt = `You are "EduBite AI", powered by Grok. You are a friendly and encouraging AI tutor for a microlearning app. You help students understand topics across Science, IT/Technology, Language, and Nature.

Your teaching style:
- Use simple, clear explanations suitable for beginners
- Include real-world examples and analogies
- Use emojis occasionally to keep it engaging
- Keep responses concise (2-4 paragraphs max)
- If asked to quiz, create 1-2 multiple choice questions
- Encourage the student and celebrate their curiosity`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...args.history.slice(-6).map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content,
      })),
      { role: 'user', content: args.message },
    ];

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: messages,
          model: "grok-beta",
          stream: false,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("xAI Error:", errData);
        throw new Error("Failed to generate response from Grok AI");
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || "I didn't get a response from Grok. Try asking differently!";
    } catch (error) {
      console.error("AI Error:", error);
      return "⚠️ Connectivity error with Grok AI. Please try again.";
    }
  }
});
