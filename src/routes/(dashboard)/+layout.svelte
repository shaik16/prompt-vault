<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import Header from '$lib/components/header.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<Header />
		<main class="flex-1 overflow-auto">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
