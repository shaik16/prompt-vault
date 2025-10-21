import { mutation } from './_generated/server';
import { v } from 'convex/values';

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
