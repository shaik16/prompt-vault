<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { useQuery } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk';
	import { goto } from '$app/navigation';
	import { api } from '../../convex/_generated/api.js';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';
	import Heart from '@lucide/svelte/icons/heart';
	import Pencil from '@lucide/svelte/icons/pencil';

	interface Prompt {
		_id: string;
		_creationTime: number;
		userId: string;
		title: string;
		promptText: string;
		category: string;
		isFavorited: boolean;
		createdAt: number;
		updatedAt: number;
	}

	const client = useConvexClient();
	const clerkContext = useClerkContext();

	// Get the current user's Clerk ID
	const clerkUserId = $derived(clerkContext.auth.userId);

	// Query to fetch user's prompts - only when user is signed in
	const promptsQuery = $derived(
		clerkUserId ? useQuery(api.prompts.getUserPrompts, { clerkUserId }) : null
	);
	const prompts = $derived(promptsQuery?.data as Prompt[] | undefined);
	const isLoading = $derived(promptsQuery?.isLoading ?? false);

	let showDeleteConfirm = $state(false);
	let promptToDelete: string | null = $state(null);
	let isDeleting = $state(false);

	async function handleDeletePrompt(promptId: string) {
		if (!clerkUserId) return;

		isDeleting = true;
		try {
			await client.mutation(api.prompts.deletePrompt, {
				promptId: promptId as any,
				clerkUserId
			});
			showDeleteConfirm = false;
			promptToDelete = null;
			toast.success('Prompt deleted successfully');
		} catch (error) {
			console.error('Error deleting prompt:', error);
			toast.error('Failed to delete prompt. Please try again.');
		} finally {
			isDeleting = false;
		}
	}

	async function handleToggleFavorite(promptId: string) {
		if (!clerkUserId) return;

		try {
			const result = await client.mutation(api.prompts.toggleFavorite, {
				promptId: promptId as any,
				clerkUserId
			});
			if (result.isFavorited) {
				toast.success('Added to favorites');
			} else {
				toast.success('Removed from favorites');
			}
		} catch (error) {
			console.error('Error toggling favorite:', error);
			toast.error('Failed to update favorite status');
		}
	}

	async function handleCopyPrompt(promptText: string) {
		try {
			await navigator.clipboard.writeText(promptText);
			toast.success('Prompt copied to clipboard!');
		} catch (error) {
			console.error('Error copying prompt:', error);
			toast.error('Failed to copy prompt');
		}
	}

	function openDeleteConfirm(promptId: string) {
		promptToDelete = promptId;
		showDeleteConfirm = true;
	}

	function closeDeleteConfirm() {
		showDeleteConfirm = false;
		promptToDelete = null;
	}
</script>

<div class="space-y-6 p-6">
	<div>
		<h2 class="text-2xl font-bold">My Prompts</h2>
		<p class="text-sm text-muted-foreground">Manage and organize your AI prompts</p>
	</div>

	<!-- Category tabs -->
	<div class="flex gap-2 overflow-x-auto pb-2">
		{#each ['All', 'Marketing', 'Code', 'Creative', 'Writing', 'Business'] as category}
			<button
				class="rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
				class:bg-primary={category === 'All'}
				class:text-primary-foreground={category === 'All'}
				class:bg-secondary={category !== 'All'}
				class:text-secondary-foreground={category !== 'All'}
			>
				{category}
			</button>
		{/each}
	</div>

	<!-- Loading state with skeleton loaders -->
	{#if isLoading}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each Array(6) as _}
				<div class="rounded-lg border border-border bg-card p-4 shadow-sm">
					<!-- Skeleton for favorite button -->
					<div class="absolute top-3 right-3">
						<Skeleton class="h-9 w-9 rounded-full" />
					</div>

					<!-- Skeleton for category badge -->
					<Skeleton class="mb-3 h-6 w-20 rounded-full" />

					<!-- Skeleton for title (2 lines) -->
					<Skeleton class="mb-2 h-5 w-full rounded" />
					<Skeleton class="mb-4 h-5 w-3/4 rounded" />

					<!-- Skeleton for description (3 lines) -->
					<Skeleton class="mb-2 h-4 w-full rounded" />
					<Skeleton class="mb-2 h-4 w-full rounded" />
					<Skeleton class="mb-4 h-4 w-2/3 rounded" />

					<!-- Skeleton for buttons -->
					<div class="flex gap-2">
						<Skeleton class="h-9 w-9 rounded" />
						<Skeleton class="h-9 w-9 rounded" />
					</div>
				</div>
			{/each}
		</div>
	{:else if !prompts || prompts.length === 0}
		<!-- Empty state -->
		<div
			class="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-12"
		>
			<div class="text-center">
				<h3 class="mb-2 text-lg font-semibold">No prompts yet</h3>
				<p class="mb-6 text-sm text-muted-foreground">Create your first prompt to get started</p>
				<button
					onclick={() => goto('/new')}
					class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Create Your First Prompt
				</button>
			</div>
		</div>
	{:else}
		<!-- Prompts grid -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each prompts as prompt (prompt._id)}
				<div
					class="relative rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
				>
					<!-- Favorite heart button -->
					<button
						onclick={() => handleToggleFavorite(prompt._id)}
						class="absolute top-3 right-3 rounded-full p-1.5 transition-colors hover:bg-secondary"
						title={prompt.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
					>
						{#if prompt.isFavorited}
							<Heart class="h-5 w-5 fill-red-500 text-red-500 transition-colors" />
						{:else}
							<Heart class="h-5 w-5 text-muted-foreground transition-colors" />
						{/if}
					</button>

					<div
						class="mb-3 inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary capitalize"
					>
						{prompt.category}
					</div>
					<h3 class="mb-2 line-clamp-2 font-semibold">{prompt.title}</h3>
					<p class="mb-4 line-clamp-3 text-sm text-muted-foreground">
						{prompt.promptText}
					</p>
					<div class="flex gap-2">
						<button
							onclick={() => handleCopyPrompt(prompt.promptText)}
							class="rounded p-2 hover:bg-secondary"
							title="Copy prompt"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
							<span class="sr-only">Copy prompt</span>
						</button>
						<button
							onclick={() => goto(`/edit/${prompt._id}`)}
							class="rounded p-2 hover:bg-secondary"
							title="Edit prompt"
						>
							<Pencil class="h-4 w-4" />
							<span class="sr-only">Edit prompt</span>
						</button>
						<button
							onclick={() => openDeleteConfirm(prompt._id)}
							class="rounded p-2 hover:bg-secondary"
							title="Delete prompt"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							<span class="sr-only">Delete prompt</span>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Delete confirmation dialog -->
	{#if showDeleteConfirm && promptToDelete}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div class="rounded-lg bg-background p-6 shadow-lg">
				<h3 class="mb-2 text-lg font-semibold">Delete Prompt?</h3>
				<p class="mb-6 text-sm text-muted-foreground">
					This action cannot be undone. Are you sure you want to delete this prompt?
				</p>
				<div class="flex gap-3">
					<button
						onclick={closeDeleteConfirm}
						class="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
					>
						Cancel
					</button>
					<button
						onclick={() => handleDeletePrompt(promptToDelete!)}
						disabled={isDeleting}
						class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
					>
						{isDeleting ? 'Deleting...' : 'Delete'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
