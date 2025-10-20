import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	// Define your tables here
	// Example:
	// prompts: defineTable({
	//   userId: v.string(),
	//   title: v.string(),
	//   content: v.string(),
	//   createdAt: v.number(),
	// })
	//   .index('by_userId', ['userId'])
	//   .index('by_createdAt', ['createdAt']),
});

