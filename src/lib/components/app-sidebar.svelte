<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Heart from '@lucide/svelte/icons/heart';
	import Settings from '@lucide/svelte/icons/settings';
	import Home from '@lucide/svelte/icons/home';
	import Bookmark from '@lucide/svelte/icons/bookmark';
	import { page } from '$app/stores';
	import Logo from '$lib/assets/logo.svg';

	const menuItems = [
		{
			title: 'My Prompts',
			icon: Home,
			url: '/'
		},
		{
			title: 'Favorites',
			icon: Heart,
			url: '/favorites'
		},
		{
			title: 'Settings',
			icon: Settings,
			url: '/settings'
		}
	];

	function isActive(url: string): boolean {
		const currentPath = $page.url.pathname;
		if (url === '/') {
			return currentPath === '/';
		}
		return currentPath.startsWith(url);
	}
</script>

<Sidebar.Root>
	<Sidebar.Header>
		<div class="flex items-center gap-2 px-2 py-4">
			<img src={Logo} alt="logo" width="150" />
		</div>
	</Sidebar.Header>

	<Sidebar.Content>
		<Sidebar.Group class="py-0">
			<Sidebar.GroupContent class="px-0">
				<Sidebar.Menu class="gap-1">
					{#each menuItems as item (item.title)}
						<Sidebar.MenuItem>
							<a
								href={item.url}
								class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
								class:bg-sidebar-accent={isActive(item.url)}
								class:text-sidebar-accent-foreground={isActive(item.url)}
								class:font-bold={isActive(item.url)}
							>
								<svelte:component this={item.icon} class="h-4 w-4 flex-shrink-0" />
								<span class="flex-1">{item.title}</span>
							</a>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
</Sidebar.Root>
