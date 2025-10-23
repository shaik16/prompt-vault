<script lang="ts">
	import { cn } from "$lib/utils.js";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLElement> {
		disabled?: boolean;
	}

	let { disabled = false, class: className, ...restProps }: Props = $props();
</script>

<button
	{disabled}
	class={cn(
		"inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
		className
	)}
	{...restProps}
>
	<ChevronLeftIcon class="h-4 w-4" />
	<span class="sr-only">Go to previous page</span>
</button>

