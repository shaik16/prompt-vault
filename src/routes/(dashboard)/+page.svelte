<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { LayoutData } from './$types';

	// SvelteKit passes the result of your load function into this 'data' prop.
	export let data: LayoutData;
	console.log(data);
</script>

<div class="flex h-screen items-center justify-center bg-background">
	<div class="text-center">
		<h1 class="mb-4 text-4xl font-bold">Welcome to PromptVault</h1>
		<Button>Get Started</Button>
	</div>
</div>
