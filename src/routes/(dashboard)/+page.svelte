<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { useQuery } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk';
	import { goto } from '$app/navigation';
	import { api } from '../../convex/_generated/api.js';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { toast } from 'svelte-sonner';
	import PromptCard from '$lib/components/PromptCard.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

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

	// Category state
	let selectedCategory = $state('All');

	// Pagination state
	let allPrompts: Prompt[] = $state([]);
	let nextCursor: string | null = $state(null);
	let hasMore = $state(false);
	let isLoadingMore = $state(false);

	// Query to fetch user's prompts with category filter - only when user is signed in
	const promptsQuery = $derived(
		clerkUserId
			? useQuery(api.prompts.getUserPrompts, {
					clerkUserId,
					category: selectedCategory.toLocaleLowerCase(),
					limit: 12,
					...(nextCursor ? { cursor: nextCursor } : {})
				})
			: null
	);

	const queryData = $derived(promptsQuery?.data as any);
	const isLoading = $derived(promptsQuery?.isLoading ?? false);

	// Update allPrompts when category changes or initial data loads
	$effect(() => {
		if (selectedCategory) {
			// Reset pagination when category changes
			allPrompts = [];
			nextCursor = null;
			hasMore = false;
		}
	});

	// Update allPrompts when query data changes
	$effect(() => {
		if (queryData?.prompts) {
			if (nextCursor) {
				// Append to existing prompts (pagination)
				allPrompts = [...allPrompts, ...queryData.prompts];
			} else {
				// Replace with new prompts (initial load or category change)
				allPrompts = queryData.prompts;
			}
			hasMore = queryData.hasMore ?? false;
			nextCursor = queryData.nextCursor ?? null;
			isLoadingMore = false;
		}
	});

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
				onclick={() => (selectedCategory = category)}
				class={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
					selectedCategory === category
						? 'bg-primary text-primary-foreground'
						: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
				}`}
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
	{:else if !allPrompts || allPrompts.length === 0}
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
			{#each allPrompts as prompt (prompt._id)}
				<PromptCard
					{prompt}
					onToggleFavorite={handleToggleFavorite}
					onCopy={handleCopyPrompt}
					onEdit={(promptId) => goto(`/edit/${promptId}`)}
					onDelete={openDeleteConfirm}
				/>
			{/each}
		</div>

		<!-- Load More button -->
		{#if hasMore && !isLoading}
			<div class="flex justify-center pt-6">
				<button
					onclick={() => {
						isLoadingMore = true;
					}}
					disabled={isLoadingMore}
					class="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
				>
					{isLoadingMore ? 'Loading...' : 'Load More'}
				</button>
			</div>
		{/if}
	{/if}

	<!-- Delete confirmation dialog -->
	<AlertDialog.Root bind:open={showDeleteConfirm}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Delete Prompt?</AlertDialog.Title>
				<AlertDialog.Description>
					This action cannot be undone. Are you sure you want to delete this prompt?
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel onclick={closeDeleteConfirm} disabled={isDeleting}>
					Cancel
				</AlertDialog.Cancel>
				<AlertDialog.Action
					onclick={() => handleDeletePrompt(promptToDelete!)}
					disabled={isDeleting}
				>
					{isDeleting ? 'Deleting...' : 'Delete'}
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</div>
