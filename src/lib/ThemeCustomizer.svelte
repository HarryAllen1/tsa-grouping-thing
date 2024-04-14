<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import Paintbrush from 'lucide-svelte/icons/paintbrush';
	import Customizer from './Customizer.svelte';
</script>

<div class="flex items-center">
	<div class="block md:hidden">
		<Drawer.Root>
			<Drawer.Trigger asChild let:builder>
				<Button variant="ghost" size="icon" builders={[builder]}>
					<Paintbrush />
				</Button>
			</Drawer.Trigger>
			<Drawer.Content class="bg-white p-6 dark:bg-zinc-950">
				<Customizer />
			</Drawer.Content>
		</Drawer.Root>
	</div>
	<div class="hidden md:block">
		<Popover.Root>
			<Popover.Trigger asChild let:builder>
				<Button variant="ghost" size="icon" builders={[builder]}>
					<Paintbrush />
				</Button>
			</Popover.Trigger>
			<Popover.Content
				class="z-40 w-[340px] rounded-[0.5rem] bg-white p-6 dark:bg-zinc-950"
				align="end"
			>
				<Customizer />
			</Popover.Content>
		</Popover.Root>
	</div>
</div>
