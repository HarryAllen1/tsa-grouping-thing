<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { cn } from '$lib/utils.js';
	import Check from '@lucide/svelte/icons/check';
	import Moon from '@lucide/svelte/icons/moon';
	import Reset from '@lucide/svelte/icons/rotate-ccw';
	import Sun from '@lucide/svelte/icons/sun';
	import { mode, setMode } from 'mode-watcher';
	import { Input } from './components/ui/input';
	import { config } from './config.js';
	import { themes } from './themes.js';
</script>

<div class="flex items-start">
	<div class="space-y-1 pr-2">
		<div class="leading-none font-semibold tracking-tight">Customize</div>
		<div class="text-muted-foreground text-xs">
			Pick a style and color for the site.
		</div>
	</div>
	<Button
		variant="ghost"
		size="icon"
		class="ml-auto rounded-[0.5rem]"
		onclick={() => {
			$config.radius = 0.5;
			$config.theme = 'default';
			$config.background = null;
		}}
	>
		<Reset />
		<span class="sr-only"> Reset </span>
	</Button>
</div>
<div class="flex flex-1 flex-col space-y-4 md:space-y-6">
	<div class="mt-2 space-y-1">
		<Label class="text-xs">Color</Label>
		<div class="grid grid-cols-3 gap-2">
			{#each themes as theme (theme.name)}
				{@const isActive = $config.theme === theme.name}
				<Button
					variant="outline"
					size="sm"
					onclick={() => {
						$config.theme = theme.name;
					}}
					class={cn('justify-start', isActive && '!border-primary border-2')}
					style="--theme-primary: {theme.primaryColor[mode.current ?? 'dark']}"
				>
					<span
						class="mr-1 flex h-5 w-5 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-(--theme-primary)"
					>
						{#if isActive}
							<Check class="h-4 w-4 text-white" />
						{/if}
					</span>
					{theme.label}
				</Button>
			{/each}
		</div>
	</div>
	<div class="space-y-1.5">
		<Label class="text-xs">Radius</Label>
		<div class="grid grid-cols-5 gap-2">
			{#each ['0', '0.3', '0.5', '0.75', '1.0'] as value (value)}
				{@const valueFloat = Number.parseFloat(value)}
				<Button
					variant="outline"
					size="sm"
					onclick={() => {
						$config.radius = valueFloat;
					}}
					class={cn(
						$config.radius === valueFloat && '!border-primary border-2',
					)}
				>
					{value}
				</Button>
			{/each}
		</div>
	</div>
	<div class="space-y-1.5">
		<Label class="text-xs">Mode</Label>
		<div class="grid grid-cols-3 gap-2">
			<Button
				variant="outline"
				size="sm"
				onclick={() => setMode('light')}
				class={cn(mode.current === 'light' && '!border-primary border-2')}
			>
				<Sun class="mr-1 size-4 -translate-x-1" />
				Light
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() => setMode('dark')}
				class={cn(mode.current === 'dark' && '!border-primary border-2')}
			>
				<Moon class="mr-1 size-4 -translate-x-1" />
				Dark
			</Button>
		</div>
	</div>
	<div class="space-y-1.5">
		<Label class="text-xs" for="bgCustom">Background</Label>
		<Input
			id="bgCustom"
			placeholder="Image URL"
			type="url"
			bind:value={$config.background}
		/>
		<Button onclick={() => ($config.background = null)}>Clear</Button>
	</div>
</div>
