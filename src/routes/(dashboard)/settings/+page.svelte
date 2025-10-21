<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import { useConvexClient } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk';
	import { api } from '../../../convex/_generated/api.js';
	import { toast } from 'svelte-sonner';

	const client = useConvexClient();
	const clerkContext = useClerkContext();

	let apiKey = $state('');
	let isEditing = $state(false);
	let showKey = $state(false);
	let isSaved = $state(false);
	let copyFeedback = $state(false);
	let isSaving = $state(false);
	let isLoading = $state(true);
	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);

	// Load the API key on mount
	$effect(() => {
		const clerkUserId = clerkContext.auth.userId;
		if (clerkUserId) {
			loadApiKey(clerkUserId);
		}
	});

	async function loadApiKey(clerkUserId: string) {
		try {
			isLoading = true;
			const key = await client.query(api.users.getOpenAIKey, { clerkUserId });
			if (key) {
				apiKey = key;
			}
		} catch (error) {
			console.error('Error loading API key:', error);
		} finally {
			isLoading = false;
		}
	}

	function toggleEdit() {
		isEditing = !isEditing;
		if (!isEditing) {
			showKey = false;
		}
	}

	function toggleKeyVisibility() {
		showKey = !showKey;
	}

	async function handleSave() {
		const clerkUserId = clerkContext.auth.userId;
		if (!clerkUserId) {
			toast.error('You must be signed in to save API key');
			return;
		}

		if (!apiKey.trim()) {
			toast.error('API key cannot be empty');
			return;
		}

		try {
			isSaving = true;
			await client.mutation(api.users.saveOpenAIKey, {
				clerkUserId,
				openaiApiKey: apiKey
			});

			toast.success('API key saved successfully!');
			isSaved = true;
			isEditing = false;
			showKey = false;

			// Reset the saved feedback after 2 seconds
			setTimeout(() => {
				isSaved = false;
			}, 2000);
		} catch (error) {
			console.error('Error saving API key:', error);
			const message = error instanceof Error ? error.message : 'Failed to save API key';
			toast.error(message);
		} finally {
			isSaving = false;
		}
	}

	function copyToClipboard() {
		if (apiKey) {
			navigator.clipboard.writeText(apiKey);
			copyFeedback = true;

			// Reset the copy feedback after 2 seconds
			setTimeout(() => {
				copyFeedback = false;
			}, 2000);
		}
	}

	function getMaskedKey(key: string): string {
		if (!key) return '';
		if (key.length <= 4) return '*'.repeat(key.length);
		return key.substring(0, 2) + '*'.repeat(key.length - 4) + key.substring(key.length - 2);
	}

	async function handleDelete() {
		const clerkUserId = clerkContext.auth.userId;
		if (!clerkUserId) {
			toast.error('You must be signed in to delete API key');
			return;
		}

		try {
			isDeleting = true;
			await client.mutation(api.users.deleteOpenAIKey, { clerkUserId });

			toast.success('API key deleted successfully');
			apiKey = '';
			showDeleteConfirm = false;
			isEditing = false;
		} catch (error) {
			console.error('Error deleting API key:', error);
			const message = error instanceof Error ? error.message : 'Failed to delete API key';
			toast.error(message);
		} finally {
			isDeleting = false;
		}
	}

	function confirmDelete() {
		showDeleteConfirm = true;
	}

	function cancelDelete() {
		showDeleteConfirm = false;
	}
</script>

<div class="space-y-6 p-6">
	<div>
		<h2 class="text-2xl font-bold">Settings</h2>
		<p class="text-sm text-muted-foreground">Manage your account and API keys</p>
	</div>

	<!-- OpenAI API Key Section -->
	<div class="rounded-lg border border-border bg-card p-6">
		<h3 class="mb-4 text-lg font-semibold">OpenAI API Key</h3>

		{#if isLoading}
			<!-- Loading State -->
			<div class="space-y-4">
				<p class="text-sm text-muted-foreground">Loading API key...</p>
			</div>
		{:else if !isEditing && apiKey}
			<!-- Display Mode -->
			<div class="space-y-4">
				<div class="flex items-center gap-3 rounded-md bg-secondary/50 p-3">
					<input
						type="text"
						value={showKey ? apiKey : getMaskedKey(apiKey)}
						readonly
						class="flex-1 bg-transparent font-mono text-sm outline-none"
					/>
					<button
						onclick={toggleKeyVisibility}
						class="rounded p-1.5 transition-colors hover:bg-secondary"
						title={showKey ? 'Hide key' : 'Show key'}
					>
						{#if showKey}
							<EyeOff class="h-4 w-4" />
						{:else}
							<Eye class="h-4 w-4" />
						{/if}
					</button>
					<button
						onclick={copyToClipboard}
						class="rounded p-1.5 transition-colors hover:bg-secondary"
						title="Copy to clipboard"
					>
						{#if copyFeedback}
							<Check class="h-4 w-4 text-green-500" />
						{:else}
							<Copy class="h-4 w-4" />
						{/if}
					</button>
				</div>

				<div class="flex gap-2">
					<button
						onclick={toggleEdit}
						class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Edit
					</button>
					<button
						onclick={confirmDelete}
						disabled={isDeleting}
						class="rounded-md border border-destructive bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isDeleting ? 'Deleting...' : 'Delete'}
					</button>
				</div>
			</div>
		{:else if isEditing}
			<!-- Edit Mode -->
			<div class="space-y-4">
				<div>
					<label for="api-key" class="mb-2 block text-sm font-medium">API Key</label>
					<input
						id="api-key"
						type={showKey ? 'text' : 'password'}
						bind:value={apiKey}
						placeholder="sk-..."
						disabled={isSaving}
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
					/>
				</div>

				<div class="flex gap-2">
					<button
						onclick={handleSave}
						disabled={!apiKey || isSaving}
						class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSaving ? 'Saving...' : 'Save'}
					</button>
					<button
						onclick={toggleEdit}
						disabled={isSaving}
						class="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
					>
						Cancel
					</button>
				</div>
			</div>
		{:else}
			<!-- Empty State -->
			<div class="space-y-4">
				<p class="text-sm text-muted-foreground">No API key configured yet.</p>
				<button
					onclick={toggleEdit}
					class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Add API Key
				</button>
			</div>
		{/if}

		<!-- Success Message -->
		{#if isSaved}
			<div class="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
				✓ API key saved successfully
			</div>
		{/if}

		<!-- Delete Confirmation Dialog -->
		{#if showDeleteConfirm}
			<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
				<div class="rounded-lg border border-border bg-card p-6 shadow-lg">
					<h3 class="mb-2 text-lg font-semibold">Delete API Key?</h3>
					<p class="mb-6 text-sm text-muted-foreground">
						This action cannot be undone. You will need to add a new API key to use AI features.
					</p>
					<div class="flex gap-2">
						<button
							onclick={cancelDelete}
							disabled={isDeleting}
							class="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							onclick={handleDelete}
							disabled={isDeleting}
							class="text-destructive-foreground flex-1 rounded-md bg-destructive px-4 py-2 text-sm font-medium transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isDeleting ? 'Deleting...' : 'Delete'}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
