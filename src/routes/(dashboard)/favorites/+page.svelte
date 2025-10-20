<script lang="ts">
	import Heart from '@lucide/svelte/icons/heart';

	interface FavoriteCard {
		id: number;
		title: string;
		category: string;
		description: string;
	}

	const favorites: FavoriteCard[] = [
		{
			id: 1,
			title: 'Email Marketing Copy',
			category: 'Marketing',
			description: 'Generate compelling email subject lines and body copy for marketing campaigns.'
		},
		{
			id: 2,
			title: 'React Component Generator',
			category: 'Code',
			description: 'Create boilerplate React components with hooks and TypeScript support.'
		},
		{
			id: 3,
			title: 'Creative Story Starter',
			category: 'Creative',
			description: 'Generate unique story openings and plot ideas for creative writing projects.'
		},
		{
			id: 4,
			title: 'Business Plan Outline',
			category: 'Business',
			description: 'Create structured business plan outlines with key sections and metrics.'
		},
		{
			id: 5,
			title: 'Technical Documentation',
			category: 'Writing',
			description: 'Generate clear and concise technical documentation for software projects.'
		}
	];
</script>

<div class="space-y-6 p-6">
	<div>
		<h2 class="text-2xl font-bold">Favorites</h2>
		<p class="text-sm text-muted-foreground">Your saved favorite prompts</p>
	</div>

	<!-- Favorites grid -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each favorites as card (card.id)}
			<div
				class="relative rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
			>
				<!-- Favorite heart button (always filled on favorites page) -->
				<button
					class="absolute top-3 right-3 rounded-full p-1.5 transition-colors hover:bg-secondary"
					title="Remove from favorites"
				>
					<Heart class="h-5 w-5 fill-red-500 text-red-500" />
				</button>

				<div
					class="mb-3 inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
				>
					{card.category}
				</div>
				<h3 class="mb-2 font-semibold">{card.title}</h3>
				<p class="mb-4 text-sm text-muted-foreground">
					{card.description}
				</p>
				<div class="flex gap-2">
					<button class="rounded p-2 hover:bg-secondary" title="Copy prompt">
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
					<button class="rounded p-2 hover:bg-secondary" title="Delete prompt">
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
</div>

