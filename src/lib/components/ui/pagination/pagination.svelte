<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
		count: number;
		perPage?: number;
		page?: number;
		children?: Snippet<
			[
				{
					pages: Array<{ type: 'page' | 'ellipsis'; value?: number; key: string }>;
					currentPage: number;
					goToPage: (page: number) => void;
					nextPage: () => void;
					prevPage: () => void;
					totalPages: number;
				}
			]
		>;
	}

	let { count, perPage = 10, page = 1, class: className, children, ...restProps }: Props = $props();

	let currentPage = $state(page);

	// Sync internal state with prop
	$effect(() => {
		currentPage = page;
	});

	const totalPages = $derived(Math.ceil(count / perPage) || 1);

	const pages = $derived.by(() => {
		const pages: Array<{ type: 'page' | 'ellipsis'; value?: number; key: string }> = [];
		const maxPagesToShow = 5;
		const halfWindow = Math.floor(maxPagesToShow / 2);

		let startPage = Math.max(1, currentPage - halfWindow);
		let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

		if (endPage - startPage + 1 < maxPagesToShow) {
			startPage = Math.max(1, endPage - maxPagesToShow + 1);
		}

		if (startPage > 1) {
			pages.push({ type: 'page', value: 1, key: 'page-1' });
			if (startPage > 2) {
				pages.push({ type: 'ellipsis', key: 'ellipsis-start' });
			}
		}

		for (let i = startPage; i <= endPage; i++) {
			pages.push({ type: 'page', value: i, key: `page-${i}` });
		}

		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				pages.push({ type: 'ellipsis', key: 'ellipsis-end' });
			}
			pages.push({ type: 'page', value: totalPages, key: `page-${totalPages}` });
		}

		return pages;
	});

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	function nextPage() {
		goToPage(currentPage + 1);
	}

	function prevPage() {
		goToPage(currentPage - 1);
	}
</script>

<nav
	role="navigation"
	aria-label="Pagination Navigation"
	class={cn('flex w-full justify-center', className)}
	{...restProps}
>
	{#if children}
		{@render children({ pages, currentPage, goToPage, nextPage, prevPage, totalPages })}
	{/if}
</nav>
