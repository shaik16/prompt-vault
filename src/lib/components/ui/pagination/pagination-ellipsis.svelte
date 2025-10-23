<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLElement> {}

	let { class: className, ...restProps }: Props = $props();
</script>

<span class={cn("flex h-10 w-10 items-center justify-center", className)} {...restProps}>
	<span class="text-muted-foreground">...</span>
</span>

