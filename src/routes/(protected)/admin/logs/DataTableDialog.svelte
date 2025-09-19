<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import Maximize from '@lucide/svelte/icons/maximize';

	interface Props {
		data: Record<string, boolean | number | string | null>;
	}
	let { data }: Props = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger
		class={buttonVariants({
			variant: 'outline',
			size: 'icon',
		})}
	>
		<Maximize class="h-6 w-6" />
	</Dialog.Trigger>
	<Dialog.Content class="max-h-screen overflow-y-auto">
		<pre>{JSON.stringify(data, null, 2)}</pre>
	</Dialog.Content>
</Dialog.Root>
