<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLElement> {
		isActive?: boolean;
		page?: { value: number };
	}

	let { isActive = false, page, class: className, ...restProps }: Props = $props();
</script>

<button
	class={cn(
		"inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
		isActive && "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
		className
	)}
	{...restProps}
>
	<slot />
</button>

