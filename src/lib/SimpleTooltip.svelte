<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { Snippet } from 'svelte';

	let {
		message,
		children,
	}: {
		message: string;
		children: Snippet;
	} = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger>
		{@render children()}
	</Tooltip.Trigger>
	<Tooltip.Content>
		<p>
			{message}
		</p>
	</Tooltip.Content>
</Tooltip.Root>
