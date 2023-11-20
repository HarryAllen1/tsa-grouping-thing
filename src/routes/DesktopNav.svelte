<script lang="ts">
	import { page } from '$app/stores';
	import * as Dropdown from '$lib/components/ui/dropdown-menu';
	import { cn } from '$lib/utils';
	import { ChevronUp } from 'lucide-svelte';

	export let navItems: (
		| { title: string; href: string }
		| { title: string; href: string }[]
	)[];

	let open = false;
</script>

<div class="mr-4 hidden lg:flex">
	<a href="/" class="mr-6 flex items-center space-x-2">
		<span class="hidden font-bold sm:inline-block"> TSA Grouping Thing </span>
	</a>
	<nav class="flex items-center space-x-6 text-sm font-medium">
		{#each navItems as navItem}
			{#if Array.isArray(navItem)}
				<Dropdown.Root bind:open>
					<Dropdown.Trigger
						class="flex flex-row items-center {$page.url.pathname.includes(
							'admin',
						)
							? 'text-foreground'
							: 'text-foreground/60'}"
					>
						Admin
						<ChevronUp
							class="{open
								? 'rotate-180'
								: ''} transition-transform duration-150 ease-in-out h-6 w-6 ml-2"
						/>
					</Dropdown.Trigger>
					<Dropdown.Content>
						<Dropdown.Group>
							{#each navItem as navItem}
								<Dropdown.Item
									href={navItem.href}
									class={cn(
										'transition-colors hover:text-foreground/80',
										$page.url.pathname === navItem.href
											? 'text-foreground'
											: 'text-foreground/60',
									)}
								>
									{navItem.title.replace('Admin ', '')}
								</Dropdown.Item>
							{/each}
						</Dropdown.Group>
					</Dropdown.Content>
				</Dropdown.Root>
			{:else}
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
			{/if}
		{/each}
	</nav>
</div>
