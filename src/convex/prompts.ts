import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Query: Get all prompts for the current user with optional category filter and page-based pagination
export const getUserPrompts = query({
	args: {
		clerkUserId: v.string(),
		category: v.optional(v.string()),
		page: v.optional(v.number()),
		limit: v.optional(v.number())
	},
	handler: async (ctx, { clerkUserId, category, page = 1, limit = 12 }) => {
		// Look up the user by their Clerk ID
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
			.unique();

		if (!user) {
			return { prompts: [], totalCount: 0, totalPages: 0, currentPage: 1 };
		}

		let baseQuery;
		if (category && category !== 'all') {
			// Filter by category
			baseQuery = ctx.db
				.query('prompts')
				.withIndex('by_userId_category', (q) => q.eq('userId', user._id).eq('category', category));
		} else {
			// Get all prompts for this user
			baseQuery = ctx.db
				.query('prompts')
				.withIndex('by_userId_createdAt', (q) => q.eq('userId', user._id));
		}

		// Order by creation date (newest first)
		const query = baseQuery.order('desc');

		// Fetch all prompts and handle pagination in memory
		const allPrompts = await query.collect();
		const totalCount = allPrompts.length;
		const totalPages = Math.ceil(totalCount / limit);

		// Validate page number
		const validPage = Math.max(1, Math.min(page, totalPages || 1));

		// Calculate offset
		const offset = (validPage - 1) * limit;

		// Get the page of results
		const paginatedPrompts = allPrompts.slice(offset, offset + limit);

		return {
			prompts: paginatedPrompts,
			totalCount,
			totalPages,
			currentPage: validPage
		};
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
