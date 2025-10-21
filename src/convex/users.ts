import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Internal mutation to create or update a user from Clerk webhook
 * Called when user.created or user.updated events are received
 */
export const upsertFromClerk = internalMutation({
	args: {
		clerkUserId: v.string(),
		email: v.string(),
		name: v.string(),
		imageUrl: v.optional(v.string())
	},
	handler: async (ctx, { clerkUserId, email, name, imageUrl }) => {
		const now = Date.now();

		// Check if user already exists
		const existingUser = await ctx.db
			.query('users')
			.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
			.unique();

		if (existingUser) {
			// Update existing user
			await ctx.db.patch(existingUser._id, {
				email,
				name,
				imageUrl,
				updatedAt: now
			});

			return existingUser._id;
		}

		// Create new user
		const userId = await ctx.db.insert('users', {
			clerkUserId,
			email,
			name,
			imageUrl,
			createdAt: now,
			updatedAt: now
		});

		// Create corresponding userSettings entry
		await ctx.db.insert('userSettings', {
			userId,
			createdAt: now,
			updatedAt: now
		});

		return userId;
	}
});

/**
 * Internal mutation to delete a user and cascade delete related data
 * Called when user.deleted event is received
 */
export const deleteFromClerk = internalMutation({
	args: {
		clerkUserId: v.string()
	},
	handler: async (ctx, { clerkUserId }) => {
		// Find user by clerkUserId
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
			.unique();

		if (!user) {
			// User doesn't exist, nothing to delete
			return;
		}

		// Delete all prompts for this user
		const prompts = await ctx.db
			.query('prompts')
			.withIndex('by_userId', (q) => q.eq('userId', user._id))
			.collect();

		for (const prompt of prompts) {
			await ctx.db.delete(prompt._id);
		}

		// Delete user settings
		const settings = await ctx.db
			.query('userSettings')
			.withIndex('by_userId', (q) => q.eq('userId', user._id))
			.unique();

		if (settings) {
			await ctx.db.delete(settings._id);
		}

		// Delete user
		await ctx.db.delete(user._id);
	}
});

