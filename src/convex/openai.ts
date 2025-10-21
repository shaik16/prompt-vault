import { action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';

interface OpenAIResponse {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
	error?: {
		message?: string;
	};
}

/**
 * Action to generate or improve prompts using OpenAI API
 * This action retrieves the user's API key and calls OpenAI
 */
export const generatePrompt = action({
	args: {
		clerkUserId: v.string(),
		mode: v.union(v.literal('improve'), v.literal('generate')),
		category: v.string(),
		existingText: v.optional(v.string()),
		ideaText: v.optional(v.string())
	},
	handler: async (
		ctx,
		{ clerkUserId, mode, category, existingText, ideaText }
	): Promise<{ success: boolean; text: string }> => {
		// Get the user's OpenAI API key
		const apiKey: string | null = await ctx.runQuery(api.users.getOpenAIKey, { clerkUserId });

		if (!apiKey) {
			throw new Error('No OpenAI API key found. Please add your API key in Settings.');
		}

		// Prepare the prompt based on mode
		const systemPrompt = `You are an expert prompt engineer specializing in creating high-quality, detailed, and comprehensive prompts for AI models. Your task is to craft thorough, well-structured, and production-ready prompts that are clear, specific, and actionable. Include relevant context, constraints, and examples when appropriate.`;
		let userPrompt = '';

		if (mode === 'improve') {
			if (!existingText) {
				throw new Error('Existing text is required for improve mode');
			}
			userPrompt = `Please improve and enhance this ${category} prompt to make it more effective, detailed, and comprehensive:\n\n${existingText}\n\nProvide a thoroughly improved version with better structure, clarity, and detail. Include any relevant context or examples that would make the prompt more effective. Provide only the improved prompt text, without any explanation or preamble.`;
		} else if (mode === 'generate') {
			if (!ideaText) {
				throw new Error('Idea text is required for generate mode');
			}
			userPrompt = `Create a comprehensive, detailed, and well-structured ${category} prompt based on this idea:\n\n${ideaText}\n\nGenerate a thorough prompt that includes clear instructions, relevant context, specific requirements, and examples where applicable. The prompt should be production-ready and highly effective for AI models. Provide only the generated prompt text, without any explanation or preamble.`;
		}

		try {
			// Call OpenAI API
			const response: Response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model: 'gpt-3.5-turbo',
					messages: [
						{
							role: 'system',
							content: systemPrompt
						},
						{
							role: 'user',
							content: userPrompt
						}
					],
					temperature: 0.7,
					max_tokens: 2000
				})
			});

			if (!response.ok) {
				const error = (await response.json()) as OpenAIResponse;
				if (response.status === 401) {
					throw new Error('Invalid OpenAI API key. Please check your API key in Settings.');
				}
				throw new Error(error.error?.message || 'Failed to call OpenAI API');
			}

			const data = (await response.json()) as OpenAIResponse;
			const generatedText: string | undefined = data.choices?.[0]?.message?.content;

			if (!generatedText) {
				throw new Error('No response from OpenAI API');
			}

			return {
				success: true,
				text: generatedText.trim()
			};
		} catch (error) {
			console.error('OpenAI API error:', error);
			if (error instanceof Error) {
				throw new Error(error.message);
			}
			throw new Error('Failed to generate prompt. Please try again.');
		}
	}
});
