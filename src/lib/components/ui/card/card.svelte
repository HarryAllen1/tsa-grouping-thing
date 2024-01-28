<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type $$Props = HTMLAttributes<HTMLDivElement>;

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class={cn(
		'rounded-lg border bg-card text-card-foreground shadow-sm',
		className,
	)}
	{...$$restProps}
	on:drop
	on:dragover
	on:dragleave
>
	<slot />
</div>
