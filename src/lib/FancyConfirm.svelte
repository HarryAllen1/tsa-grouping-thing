<script module lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { writable } from 'svelte/store';

	const open = writable(false);
	const options = writable<[string, boolean][]>([]);

	let alertTitle = $state('test');
	let alertMessage = $state('test');

	const result = writable<boolean | null>(null);

	export const fancyConfirm = (
		title: string,
		message: string,
		dialogOptions: [string, boolean][] = [
			['Cancel', false],
			['Continue', true],
		],
	) =>
		new Promise<boolean>((resolve) => {
			alertTitle = title;
			alertMessage = message;
			open.set(true);
			options.set(dialogOptions);

			result.subscribe((r) => {
				if (r !== null) {
					open.set(false);
					result.set(null);

					resolve(r);
				}
			});
		});

	export const closeConfirmationDialog = () => open.set(false);
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
			{#each $options as option}
				{#if option[1]}
					<AlertDialog.Action on:click={() => ($result = true)}>
						{option[0]}
					</AlertDialog.Action>
				{:else}
					<AlertDialog.Cancel on:click={() => ($result = false)}>
						{option[0]}
					</AlertDialog.Cancel>
				{/if}
			{/each}
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
