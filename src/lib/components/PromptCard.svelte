<script lang="ts">
	import Heart from '@lucide/svelte/icons/heart';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Copy from '@lucide/svelte/icons/copy';
	import Trash from '@lucide/svelte/icons/trash-2';

	interface Prompt {
		_id: string;
		title: string;
		promptText: string;
		category: string;
		isFavorited: boolean;
	}

	interface Props {
		prompt: Prompt;
		onToggleFavorite: (promptId: string) => Promise<void>;
		onCopy: (promptText: string) => Promise<void>;
		onEdit: (promptId: string) => void;
		onDelete: (promptId: string) => void;
	}

	let { prompt, onToggleFavorite, onCopy, onEdit, onDelete }: Props = $props();

	let isTogglingFavorite = $state(false);
	let isCopying = $state(false);

	async function handleToggleFavorite() {
		isTogglingFavorite = true;
		try {
			await onToggleFavorite(prompt._id);
		} finally {
			isTogglingFavorite = false;
		}
	}

	async function handleCopy() {
		isCopying = true;
		try {
			await onCopy(prompt.promptText);
		} finally {
			isCopying = false;
		}
	}

	function handleEdit() {
		onEdit(prompt._id);
	}

	function handleDelete() {
		onDelete(prompt._id);
	}
</script>

<div
	class="relative rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
>
	<!-- Favorite heart button -->
	<button
		onclick={handleToggleFavorite}
		disabled={isTogglingFavorite}
		class="absolute top-3 right-3 rounded-full p-1.5 transition-colors hover:bg-secondary disabled:opacity-50"
		title={prompt.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
	>
		{#if prompt.isFavorited}
			<Heart class="h-5 w-5 fill-red-500 text-red-500 transition-colors" />
		{:else}
			<Heart class="h-5 w-5 text-muted-foreground transition-colors" />
		{/if}
	</button>

	<!-- Category badge -->
	<div
		class="mb-3 inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary capitalize"
	>
		{prompt.category}
	</div>

	<!-- Title -->
	<h3 class="mb-2 line-clamp-2 font-semibold">{prompt.title}</h3>

	<!-- Description -->
	<p class="mb-4 line-clamp-3 text-sm text-muted-foreground">
		{prompt.promptText}
	</p>

	<!-- Action buttons -->
	<div class="flex gap-2">
		<button
			onclick={handleCopy}
			disabled={isCopying}
			class="rounded p-2 hover:bg-secondary disabled:opacity-50"
			title="Copy prompt"
		>
			<Copy class="h-4 w-4" />
			<span class="sr-only">Copy prompt</span>
		</button>

		<button onclick={handleEdit} class="rounded p-2 hover:bg-secondary" title="Edit prompt">
			<Pencil class="h-4 w-4" />
			<span class="sr-only">Edit prompt</span>
		</button>

		<button onclick={handleDelete} class="rounded p-2 hover:bg-secondary" title="Delete prompt">
			<Trash class="h-4 w-4" />
			<span class="sr-only">Delete prompt</span>
		</button>
	</div>
</div>
