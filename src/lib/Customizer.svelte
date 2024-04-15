<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import Moon from 'lucide-svelte/icons/moon';
	import Reset from 'lucide-svelte/icons/rotate-ccw';
	import Sun from 'lucide-svelte/icons/sun';

	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { cn } from '$lib/utils.js';
	import { mode, setMode } from 'mode-watcher';
	import ThemeWrapper from './ThemeWrapper.svelte';
	import { config } from './config.js';
	import { themes } from './themes.js';
	import { Input } from './components/ui/input';
</script>

<ThemeWrapper defaultTheme="zinc">
	<div class="flex items-start">
		<div class="space-y-1 pr-2">
			<div class="font-semibold leading-none tracking-tight">Customize</div>
			<div class="text-xs text-muted-foreground">
				Pick a style and color for the site.
			</div>
		</div>
		<Button
			variant="ghost"
			size="icon"
			class="ml-auto rounded-[0.5rem]"
			on:click={() => {
				$config.radius = 0.5;
				$config.theme = 'zinc';
			}}
		>
			<Reset />
			<span class="sr-only"> Reset </span>
		</Button>
	</div>
	<div class="flex flex-1 flex-col space-y-4 md:space-y-6">
		<div class="5 space-y-1">
			<Label class="text-xs">Color</Label>
			<div class="grid grid-cols-3 gap-2">
				{#each themes as theme (theme.name)}
					{@const isActive = $config.theme === theme.name}
					<Button
						variant="outline"
						size="sm"
						on:click={() => {
							$config.theme = theme.name;
						}}
						class={cn('justify-start', isActive && 'border-2 border-primary')}
						style="--theme-primary: hsl({theme.activeColor[$mode ?? 'dark']})"
					>
						<span
							class="mr-1 flex h-5 w-5 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-[--theme-primary]"
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
				{#each ['0', '0.3', '0.5', '0.75', '1.0'] as value, _ (value)}
					{@const valueFloat = Number.parseFloat(value)}
					<Button
						variant="outline"
						size="sm"
						on:click={() => {
							$config.radius = valueFloat;
						}}
						class={cn(
							$config.radius === valueFloat && 'border-2 border-primary',
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
					on:click={() => setMode('light')}
					class={cn($mode === 'light' && 'border-2 border-primary')}
				>
					<Sun class="mr-1 size-4 -translate-x-1" />
					Light
				</Button>
				<Button
					variant="outline"
					size="sm"
					on:click={() => setMode('dark')}
					class={cn($mode === 'dark' && 'border-2 border-primary')}
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
			<Button on:click={() => ($config.background = null)}>Clear</Button>
		</div>
	</div>
</ThemeWrapper>
