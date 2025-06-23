<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Copy from '@lucide/svelte/icons/copy';
	import { toast } from 'svelte-sonner';

	let { text }: { text: string } = $props();
</script>

<Button
	variant="ghost"
	size="icon"
	class="m-0 h-8 w-8 p-0"
	onclick={async () => {
		await navigator.clipboard.writeText(text);
		toast.success('Copied text to clipboard');
	}}
>
	<Copy class="h-4 w-4" />
</Button>
