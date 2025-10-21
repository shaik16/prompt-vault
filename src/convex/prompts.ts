import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Query: Get all prompts for the current user, ordered by creation date (newest first)
export const getUserPrompts = query({
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
			return [];
		}

		// Get all prompts for this user, ordered by creation date (newest first)
		const prompts = await ctx.db
			.query('prompts')
			.withIndex('by_userId_createdAt', (q) => q.eq('userId', user._id))
			.order('desc')
			.collect();

		return prompts;
	}
});

// Query: Get all favorited prompts for the current user
export const getFavoritedPrompts = query({
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
			return [];
		}

		// Get all favorited prompts for this user
		const prompts = await ctx.db
			.query('prompts')
			.withIndex('by_userId_isFavorited', (q) => q.eq('userId', user._id).eq('isFavorited', true))
			.order('desc')
			.collect();

		return prompts;
	}
});

// Mutation: Create a new prompt
export const create = mutation({
	args: {
		title: v.string(),
		promptText: v.string(),
		category: v.string(),
		clerkUserId: v.string()
	},
	handler: async (ctx, { title, promptText, category, clerkUserId }) => {
		// Look up the user in the users table by their Clerk ID
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
			.unique();

		if (!user) {
			throw new Error('User not found in database. Please sign out and sign back in.');
		}

		// Create the new prompt
		const now = Date.now();
		const promptId = await ctx.db.insert('prompts', {
			userId: user._id,
			title: title.trim(),
			promptText: promptText.trim(),
			category,
			isFavorited: false,
			createdAt: now,
			updatedAt: now
		});

		return promptId;
	}
});

// Mutation: Delete a prompt by ID
export const deletePrompt = mutation({
	args: {
		promptId: v.id('prompts'),
		clerkUserId: v.string()
	},
	handler: async (ctx, { promptId, clerkUserId }) => {
		// Get the prompt
		const prompt = await ctx.db.get(promptId);

		if (!prompt) {
			throw new Error('Prompt not found');
		}

		// Look up the user to verify ownership
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
			.unique();

		if (!user || prompt.userId !== user._id) {
			throw new Error('You do not have permission to delete this prompt');
		}

		// Delete the prompt
		await ctx.db.delete(promptId);

		return { success: true };
	}
});

// Mutation: Toggle favorite status of a prompt
export const toggleFavorite = mutation({
	args: {
		promptId: v.id('prompts'),
		clerkUserId: v.string()
	},
	handler: async (ctx, { promptId, clerkUserId }) => {
		// Get the prompt
		const prompt = await ctx.db.get(promptId);

		if (!prompt) {
			throw new Error('Prompt not found');
		}

		// Look up the user to verify ownership
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
			.unique();

		if (!user || prompt.userId !== user._id) {
			throw new Error('You do not have permission to modify this prompt');
		}

		// Toggle the favorite status
		const newFavoritedStatus = !prompt.isFavorited;
		await ctx.db.patch(promptId, {
			isFavorited: newFavoritedStatus,
			updatedAt: Date.now()
		});

		return { isFavorited: newFavoritedStatus };
	}
});

// Query: Get a single prompt by ID
export const getPromptById = query({
	args: {
		promptId: v.id('prompts'),
		clerkUserId: v.string()
	},
	handler: async (ctx, { promptId, clerkUserId }) => {
		// Get the prompt
		const prompt = await ctx.db.get(promptId);

		if (!prompt) {
			throw new Error('Prompt not found');
		}

		// Look up the user to verify ownership
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
			.unique();

		if (!user || prompt.userId !== user._id) {
			throw new Error('You do not have permission to access this prompt');
		}

		return prompt;
	}
});

// Mutation: Update a prompt
export const updatePrompt = mutation({
	args: {
		promptId: v.id('prompts'),
		clerkUserId: v.string(),
		title: v.string(),
		promptText: v.string(),
		category: v.string()
	},
	handler: async (ctx, { promptId, clerkUserId, title, promptText, category }) => {
		// Get the prompt
		const prompt = await ctx.db.get(promptId);

		if (!prompt) {
			throw new Error('Prompt not found');
		}

		// Look up the user to verify ownership
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
			.unique();

		if (!user || prompt.userId !== user._id) {
			throw new Error('You do not have permission to modify this prompt');
		}

		// Update the prompt
		await ctx.db.patch(promptId, {
			title: title.trim(),
			promptText: promptText.trim(),
			category,
			updatedAt: Date.now()
		});

		return { success: true };
	}
});
