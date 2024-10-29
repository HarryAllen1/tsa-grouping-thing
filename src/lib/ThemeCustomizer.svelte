<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Paintbrush from 'lucide-svelte/icons/paintbrush';
	import Customizer from './Customizer.svelte';

	const sidebar = Sidebar.useSidebar();
</script>

<Drawer.Root>
	<Drawer.Trigger>
		{#snippet child({ props })}
			<Sidebar.MenuButton {...props} class="flex md:hidden">
				<Paintbrush />

				<span>Customize</span>
			</Sidebar.MenuButton>
		{/snippet}
	</Drawer.Trigger>
	<Drawer.Content class="bg-white p-6 dark:bg-zinc-950">
		<Customizer />
	</Drawer.Content>
</Drawer.Root>
<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Sidebar.MenuButton {...props} class="hidden md:flex">
				<Paintbrush />

				<span> Customize </span>
			</Sidebar.MenuButton>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content
		side={sidebar.isMobile ? 'bottom' : 'right'}
		align="end"
		sideOffset={4}
		class="z-40 w-[340px]"
	>
		<Customizer />
	</Popover.Content>
</Popover.Root>
