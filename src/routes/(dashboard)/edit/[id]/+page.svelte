<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { useConvexClient } from 'convex-svelte';
	import { useQuery } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk';
	import { api } from '../../../../convex/_generated/api.js';
	import { toast } from 'svelte-sonner';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Loader from '@lucide/svelte/icons/loader';
	import AIPromptAssistant from '$lib/components/AIPromptAssistant.svelte';

	const client = useConvexClient();
	const clerkContext = useClerkContext();

	interface PromptForm {
		title: string;
		promptText: string;
		category: string;
	}

	const categories = [
		{ value: 'marketing', label: 'Marketing' },
		{ value: 'code', label: 'Code' },
		{ value: 'creative', label: 'Creative' },
		{ value: 'writing', label: 'Writing' },
		{ value: 'business', label: 'Business' },
		{ value: 'other', label: 'Other' }
	];

	const clerkUserId = $derived(clerkContext.auth.userId);
	const promptId = $derived($page.params.id);

	// Query to fetch the prompt
	const promptQuery = $derived(
		clerkUserId && promptId
			? useQuery(api.prompts.getPromptById, { promptId: promptId as any, clerkUserId })
			: null
	);
	const prompt = $derived(promptQuery?.data as any);
	const isLoadingPrompt = $derived(promptQuery?.isLoading ?? false);
	const queryError = $derived(promptQuery?.error as any);

	let form: PromptForm = $state({
		title: '',
		promptText: '',
		category: ''
	});

	let errors: Partial<PromptForm> = $state({});
	let isSubmitting = $state(false);
	let errorMessage = $state('');

	// Magic button state
	let isGenerating = $state(false);

	// Update form when prompt data is loaded
	$effect(() => {
		if (prompt) {
			form = {
				title: prompt.title,
				promptText: prompt.promptText,
				category: prompt.category
			};
		}
	});

	function validateForm(): boolean {
		errors = {};

		if (!form.title.trim()) {
			errors.title = 'Title is required';
		} else if (form.title.length > 100) {
			errors.title = 'Title must be less than 100 characters';
		}

		if (!form.promptText.trim()) {
			errors.promptText = 'Prompt text is required';
		} else if (form.promptText.length > 5000) {
			errors.promptText = 'Prompt text must be less than 5000 characters';
		}

		if (!form.category) {
			errors.category = 'Category is required';
		}

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validateForm()) {
			return;
		}

		if (!clerkUserId) {
			errorMessage = 'You must be signed in to update a prompt';
			return;
		}

		isSubmitting = true;
		errorMessage = '';

		try {
			await client.mutation(api.prompts.updatePrompt, {
				promptId: promptId as any,
				clerkUserId,
				title: form.title,
				promptText: form.promptText,
				category: form.category
			});

			toast.success('Prompt updated successfully!');

			setTimeout(() => {
				goto('/');
			}, 2000);
		} catch (error) {
			console.error('Error updating prompt:', error);
			const message =
				error instanceof Error ? error.message : 'Failed to update prompt. Please try again.';
			errorMessage = message;
			toast.error(message);
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		goto('/');
	}

	async function improvePrompt() {
		if (!form.promptText.trim()) {
			toast.error('Please enter a prompt to improve');
			return;
		}

		if (!clerkUserId) {
			toast.error('You must be signed in');
			return;
		}

		try {
			isGenerating = true;

			const result = await client.action((api as any).openai.generatePrompt, {
				clerkUserId,
				mode: 'improve',
				category: form.category || 'other',
				existingText: form.promptText
			});

			if (result.success) {
				form.promptText = result.text;
				toast.success('Prompt improved successfully!');
			}
		} catch (error) {
			console.error('Error improving prompt:', error);
			const message = error instanceof Error ? error.message : 'Failed to improve prompt';
			toast.error(message);
		} finally {
			isGenerating = false;
		}
	}

	async function generateFromIdea(idea: string) {
		if (!idea.trim()) {
			toast.error('Please enter an idea');
			return;
		}

		if (!clerkUserId) {
			toast.error('You must be signed in');
			return;
		}

		try {
			isGenerating = true;

			const result = await client.action((api as any).openai.generatePrompt, {
				clerkUserId,
				mode: 'generate',
				category: form.category || 'other',
				ideaText: idea
			});

			if (result.success) {
				form.promptText = result.text;
				toast.success('Prompt generated successfully!');
			}
		} catch (error) {
			console.error('Error generating prompt:', error);
			const message = error instanceof Error ? error.message : 'Failed to generate prompt';
			toast.error(message);
		} finally {
			isGenerating = false;
		}
	}
</script>

<div class="min-h-screen bg-background">
	<!-- Header with back button -->
	<div
		class="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	>
		<div class="flex items-center gap-4 px-4 py-4 sm:px-6">
			<button
				onclick={handleCancel}
				class="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft class="h-4 w-4" />
				<span>Back</span>
			</button>
			<h1 class="text-2xl font-bold">Edit Prompt</h1>
		</div>
	</div>

	<!-- Form container -->
	<div class="flex justify-center px-4 py-8 sm:px-6">
		<div class="w-full max-w-2xl space-y-6">
			<!-- Loading state -->
			{#if isLoadingPrompt}
				<div class="space-y-4">
					<Skeleton class="h-10 w-full rounded" />
					<Skeleton class="h-32 w-full rounded" />
					<Skeleton class="h-10 w-full rounded" />
					<div class="flex gap-3 pt-4">
						<Skeleton class="h-10 flex-1 rounded" />
						<Skeleton class="h-10 flex-1 rounded" />
					</div>
				</div>
			{:else if queryError}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{queryError.message || 'Failed to load prompt'}
				</div>
			{:else if prompt}
				<!-- Error message -->
				{#if errorMessage}
					<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
						{errorMessage}
					</div>
				{/if}

				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- Title input -->
					<div class="space-y-2">
						<label for="title" class="text-sm font-medium">Title</label>
						<Input
							id="title"
							type="text"
							placeholder="Enter prompt title"
							bind:value={form.title}
							maxlength={100}
						/>
						<div class="flex justify-between">
							{#if errors.title}
								<p class="text-xs text-destructive">{errors.title}</p>
							{:else}
								<p class="text-xs text-muted-foreground"></p>
							{/if}
							<p class="text-xs text-muted-foreground">{form.title.length}/100</p>
						</div>
					</div>

					<!-- Prompt text textarea with magic button -->
					<div class="space-y-2">
						<label for="promptText" class="text-sm font-medium">Prompt Text</label>

						<!-- Textarea with magic button positioned inside -->
						<div class="relative">
							<Textarea
								id="promptText"
								placeholder="Enter your prompt text here..."
								bind:value={form.promptText}
								maxlength={5000}
								rows={8}
								disabled={isSubmitting || isGenerating}
								class="pr-12"
							/>
							<!-- Magic button positioned absolutely inside textarea -->
							<div class="absolute right-2 bottom-2">
								<AIPromptAssistant
									bind:promptText={form.promptText}
									{isGenerating}
									isDisabled={isSubmitting}
									onImprove={improvePrompt}
									onGenerateFromIdea={generateFromIdea}
								/>
							</div>
							<div class="flex justify-between">
								{#if errors.promptText}
									<p class="text-xs text-destructive">{errors.promptText}</p>
								{:else}
									<p class="text-xs text-muted-foreground"></p>
								{/if}
								<p class="text-xs text-muted-foreground">{form.promptText.length}/5000</p>
							</div>
						</div>

						<!-- Category select -->
						<div class="space-y-2">
							<label for="category" class="text-sm font-medium">Category</label>
							<Select.Root
								type="single"
								value={form.category}
								onValueChange={(value: string | undefined) => {
									form.category = value || '';
								}}
							>
								<Select.Trigger id="category">
									<span
										>{form.category
											? categories.find((c) => c.value === form.category)?.label
											: 'Select a category'}</span
									>
								</Select.Trigger>
								<Select.Content>
									{#each categories as category (category.value)}
										<Select.Item value={category.value} label={category.label}>
											{category.label}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							{#if errors.category}
								<p class="text-xs text-destructive">{errors.category}</p>
							{/if}
						</div>

						<!-- Buttons -->
						<div class="flex gap-3 pt-4">
							<Button type="submit" disabled={isSubmitting} class="flex-1">
								{#if isSubmitting}
									<Loader class="mr-2 h-4 w-4 animate-spin" />
									Updating...
								{:else}
									Update Prompt
								{/if}
							</Button>
							<Button
								type="button"
								variant="outline"
								onclick={handleCancel}
								disabled={isSubmitting}
								class="flex-1"
							>
								Cancel
							</Button>
						</div>
					</div>
				</form>
			{:else}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					Prompt not found or you don't have permission to edit it.
				</div>
			{/if}
		</div>
	</div>
</div>
