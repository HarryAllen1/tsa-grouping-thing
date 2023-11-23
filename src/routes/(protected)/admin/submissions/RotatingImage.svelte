<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { RotateCw } from 'lucide-svelte';
	import type { HTMLImgAttributes } from 'svelte/elements';

	export let clickableImage = false;

	type $$Props = HTMLImgAttributes & {
		clickableImage?: boolean;
	};

	let rotation = 0;
	$: classes = cn(
		rotation % 4 === 1 && 'rotate-90',
		rotation % 4 === 2 && 'rotate-180',
		rotation % 4 === 3 && '-rotate-90',
		'transition-transform',
		$$restProps.class,
	);
</script>

<Button size="icon" on:click={() => rotation++}>
	<RotateCw />
</Button>

{#if clickableImage}
	<a href={$$restProps.src} target="_blank" rel="noopener noreferrer">
		<!-- svelte-ignore a11y-missing-attribute -->
		<img {...$$restProps} class={classes} />
	</a>
{:else}
	<!-- svelte-ignore a11y-missing-attribute -->
	<img {...$$restProps} class={classes} />
{/if}
