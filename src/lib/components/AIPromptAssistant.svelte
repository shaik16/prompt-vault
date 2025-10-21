<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import Loader from '@lucide/svelte/icons/loader';
	import Wand2 from '@lucide/svelte/icons/wand-2';
	import { toast } from 'svelte-sonner';

	interface Props {
		promptText: string;
		isGenerating: boolean;
		isDisabled: boolean;
		onImprove: () => Promise<void>;
		onGenerateFromIdea: (idea: string) => Promise<void>;
	}

	let {
		promptText = $bindable(),
		isGenerating = false,
		isDisabled = false,
		onImprove,
		onGenerateFromIdea
	}: Props = $props();

	let ideaText = $state('');
	let dropdownOpen = $state(false);

	async function handleGenerateClick() {
		if (!ideaText.trim()) {
			toast.error('Please enter an idea');
			return;
		}

		try {
			await onGenerateFromIdea(ideaText);
			ideaText = '';
			dropdownOpen = false;
		} catch (error) {
			console.error('Error generating prompt:', error);
		}
	}
</script>

<DropdownMenu.Root bind:open={dropdownOpen}>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				class="h-8 w-8 text-purple-600 hover:bg-purple-100 hover:text-purple-700"
				disabled={isDisabled || isGenerating}
				title="Use AI to improve or generate prompts"
			>
				{#if isGenerating}
					<Loader class="h-4 w-4 animate-spin" />
				{:else}
					<Wand2 class="h-4 w-4" />
				{/if}
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="w-72">
		<!-- Section 1: Generate from idea -->
		<div class="space-y-2 px-2 py-2">
			<Textarea
				placeholder="Describe your prompt idea..."
				bind:value={ideaText}
				disabled={isGenerating}
				class="min-h-[60px] resize-none text-sm"
			/>
			<Button
				type="button"
				size="sm"
				onclick={handleGenerateClick}
				disabled={!ideaText.trim() || isGenerating}
				class="w-full"
			>
				{#if isGenerating}
					<Loader class="mr-2 h-3 w-3 animate-spin" />
					Generating...
				{:else}
					<Wand2 class="mr-2 h-3 w-3" />
					Generate
				{/if}
			</Button>
		</div>

		<DropdownMenu.Separator />

		<!-- Section 2: Improve existing prompt -->
		<DropdownMenu.Item
			onclick={onImprove}
			disabled={!promptText.trim() || isGenerating}
			class="flex cursor-pointer items-center gap-2"
		>
			<span class="text-base">✨</span>
			<span>Improve Existing Prompt</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
