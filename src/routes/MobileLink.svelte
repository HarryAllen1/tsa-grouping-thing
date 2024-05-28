<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		href,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		open = $bindable(),
		class: className,
		children,
		...restProps
	}: {
		href: string;
		open: boolean;
		children: Snippet;
		class?: string;
	} = $props();
</script>

<a
	{href}
	onclick={() => (open = false)}
	class={cn(
		$page.url.pathname === href ? 'text-foreground' : 'text-foreground/60',
		className,
	)}
	{...restProps}
>
	{@render children()}
</a>
