<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { ClerkProvider } from 'svelte-clerk';
	import { setupConvex } from 'convex-svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { Toaster } from '$lib/components/ui/sonner';

	// Initialize Convex client
	setupConvex(PUBLIC_CONVEX_URL);

	const { children }: { children: Snippet } = $props();
</script>

<ClerkProvider>
	{@render children()}
	<Toaster />
</ClerkProvider>
