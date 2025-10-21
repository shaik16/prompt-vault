import { internalMutation, mutation, query } from './_generated/server';
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

/**
 * Simple encryption/decryption using btoa/atob (NOT production-grade)
 * For production, use a proper encryption library like tweetnacl or libsodium
 * This is just for demonstration purposes
 */
function encryptKey(key: string): string {
	// Simple base64 encoding with a prefix to indicate it's encrypted
	// Using btoa which is available in both browser and Convex environments
	try {
		return 'enc_' + btoa(key);
	} catch (error) {
		// Fallback if btoa fails
		return 'enc_' + key;
	}
}

function decryptKey(encryptedKey: string): string {
	// Remove the prefix and decode from base64
	if (!encryptedKey.startsWith('enc_')) {
		return encryptedKey; // Fallback for unencrypted keys
	}
	try {
		return atob(encryptedKey.slice(4));
	} catch (error) {
		// Fallback if atob fails
		return encryptedKey.slice(4);
	}
}

/**
 * Mutation to save or update the user's OpenAI API key
 */
export const saveOpenAIKey = mutation({
	args: {
		clerkUserId: v.string(),
		openaiApiKey: v.string()
	},
	handler: async (ctx, { clerkUserId, openaiApiKey }) => {
		// Look up the user by their Clerk ID
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
			.unique();

		if (!user) {
			throw new Error('User not found');
		}

		// Get or create user settings
		const settings = await ctx.db
			.query('userSettings')
			.withIndex('by_userId', (q) => q.eq('userId', user._id))
			.unique();

		const encryptedKey = encryptKey(openaiApiKey);
		const now = Date.now();

		if (settings) {
			// Update existing settings
			await ctx.db.patch(settings._id, {
				openaiApiKey: encryptedKey,
				updatedAt: now
			});
		} else {
			// Create new settings (shouldn't happen if webhook is working, but just in case)
			await ctx.db.insert('userSettings', {
				userId: user._id,
				openaiApiKey: encryptedKey,
				createdAt: now,
				updatedAt: now
			});
		}

		return { success: true };
	}
});

/**
 * Public query to check if user has an OpenAI API key
 */
export const hasOpenAIKey = query({
	args: {
		clerkUserId: v.string()
	},
	handler: async (ctx, { clerkUserId }): Promise<boolean> => {
		// Look up the user by their Clerk ID
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
			.unique();

		if (!user) {
			return false;
		}

		// Get user settings
		const settings = await ctx.db
			.query('userSettings')
			.withIndex('by_userId', (q) => q.eq('userId', user._id))
			.unique();

		return !!(settings && settings.openaiApiKey);
	}
});

/**
 * Public query to get the user's OpenAI API key (for settings page)
 * Returns the decrypted key so user can view/edit it
 */
export const getOpenAIKey = query({
	args: {
		clerkUserId: v.string()
	},
	handler: async (ctx, { clerkUserId }): Promise<string | null> => {
		// Look up the user by their Clerk ID
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
			.unique();

		if (!user) {
			return null;
		}

		// Get user settings
		const settings = await ctx.db
			.query('userSettings')
			.withIndex('by_userId', (q) => q.eq('userId', user._id))
			.unique();

		if (!settings || !settings.openaiApiKey) {
			return null;
		}

		// Decrypt and return the key
		const decryptedKey = decryptKey(settings.openaiApiKey);
		return decryptedKey;
	}
});

/**
 * Mutation to delete the user's OpenAI API key
 */
export const deleteOpenAIKey = mutation({
	args: {
		clerkUserId: v.string()
	},
	handler: async (ctx, { clerkUserId }) => {
		// Look up the user by their Clerk ID
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
			.unique();

		if (!user) {
			throw new Error('User not found');
		}

		// Get user settings
		const settings = await ctx.db
			.query('userSettings')
			.withIndex('by_userId', (q) => q.eq('userId', user._id))
			.unique();

		if (settings) {
			// Clear the API key
			await ctx.db.patch(settings._id, {
				openaiApiKey: undefined,
				updatedAt: Date.now()
			});
		}

		return { success: true };
	}
});
