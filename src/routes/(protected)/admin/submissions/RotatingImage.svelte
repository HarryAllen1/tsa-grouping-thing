<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { RotateCw } from 'lucide-svelte';
	import type { HTMLImgAttributes } from 'svelte/elements';

	let {
		clickableImage = false,
		class: className,
		src,
		...restProps
	}: HTMLImgAttributes & {
		clickableImage?: boolean;
	} = $props();

	let rotation = 0;
	let classes = $derived(
		cn(
			rotation % 4 === 1 && 'rotate-90',
			rotation % 4 === 2 && 'rotate-180',
			rotation % 4 === 3 && '-rotate-90',
			'transition-transform',
			className,
		),
	);
</script>

<Button size="icon" on:click={() => rotation++}>
	<RotateCw />
</Button>

{#if clickableImage}
	<a href={src} target="_blank" rel="noopener noreferrer">
		<img {...restProps} class={classes} />
		<span class="sr-only">{src}</span>
	</a>
{:else}
	<img {...restProps} class={classes} />
{/if}
