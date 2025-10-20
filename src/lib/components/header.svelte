<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import { UserButton } from 'svelte-clerk';
	import { goto } from '$app/navigation';

	interface Props {
		title?: string;
		showAddButton?: boolean;
		onAddClick?: () => void;
	}

	const { title = 'Dashboard', showAddButton = true, onAddClick }: Props = $props();

	function handleAddClick() {
		if (onAddClick) {
			onAddClick();
		} else {
			goto('/new');
		}
	}
</script>

<header
	class="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="flex h-14 items-center justify-between px-4 sm:px-6">
		<div class="flex items-center gap-4">
			<Sidebar.Trigger />
			<h1 class="text-lg font-semibold">{title}</h1>
		</div>

		<div class="flex space-x-4">
			{#if showAddButton}
				<button
					class="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					onclick={handleAddClick}
				>
					<Plus class="h-4 w-4" />
					<span class="hidden sm:inline">Add New Prompt</span>
					<span class="sm:hidden">Add</span>
				</button>
			{/if}
			<UserButton afterSignOutUrl="/sign-in" />
		</div>
	</div>
</header>
