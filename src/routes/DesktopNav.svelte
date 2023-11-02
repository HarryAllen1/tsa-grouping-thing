<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';

	export let navItems: { href: string; title: string }[];
</script>

<div class="mr-4 hidden lg:flex">
	<a href="/" class="mr-6 flex items-center space-x-2">
		<span class="hidden font-bold sm:inline-block"> TSA Grouping Thing </span>
	</a>
	<nav class="flex items-center space-x-6 text-sm font-medium">
		{#each navItems as navItem}
			<a
				href={navItem.href}
				class={cn(
					'transition-colors hover:text-foreground/80',
					$page.url.pathname === navItem.href
						? 'text-foreground'
						: 'text-foreground/60',
				)}
			>
				{navItem.title}
			</a>
		{/each}
	</nav>
</div>
