<script context="module" lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { writable } from 'svelte/store';

	const open = writable(false);

	let alertTitle = 'test';
	let alertMessage = 'test';

	const result = writable<boolean | null>(null);

	export const fancyConfirm = (title: string, message: string) =>
		new Promise<boolean>((resolve) => {
			alertTitle = title;
			alertMessage = message;
			open.set(true);

			result.subscribe((r) => {
				if (r !== null) {
					open.set(false);
					result.set(null);

					resolve(r);
				}
			});
		});
</script>

<AlertDialog.Root bind:open={$open}>
	<AlertDialog.Content>
		<AlertDialog.Title>
			{alertTitle}
		</AlertDialog.Title>
		<AlertDialog.Description>
			{alertMessage}
		</AlertDialog.Description>
		<AlertDialog.Footer>
			<AlertDialog.Cancel on:click={() => ($result = false)}>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action on:click={() => ($result = true)}>
				Continue
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
