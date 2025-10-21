import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	// Users table - synced from Clerk
	users: defineTable({
		clerkUserId: v.string(),
		email: v.string(),
		name: v.string(),
		imageUrl: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number()
	}).index('by_clerkUserId', ['clerkUserId']),

	// Prompts table - user-created prompts
	prompts: defineTable({
		userId: v.id('users'),
		title: v.string(),
		promptText: v.string(),
		category: v.string(), // marketing, code, creative, writing, business, other
		isFavorited: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number()
	})
		.index('by_userId', ['userId'])
		.index('by_userId_createdAt', ['userId', 'createdAt'])
		.index('by_userId_isFavorited', ['userId', 'isFavorited'])
		.index('by_userId_category', ['userId', 'category']),

	// User settings table - stores user-specific settings like API keys
	userSettings: defineTable({
		userId: v.id('users'),
		openaiApiKey: v.optional(v.string()), // encrypted/hashed
		createdAt: v.number(),
		updatedAt: v.number()
	}).index('by_userId', ['userId'])
});
