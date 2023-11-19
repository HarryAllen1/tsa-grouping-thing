<script lang="ts">
	import {
		allUsersCollection,
		db,
		storage,
		type BasicUser,
		type EventDoc,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { doc, setDoc } from 'firebase/firestore';
	import { ref, uploadBytes } from 'firebase/storage';
	import { tick } from 'svelte';

	export let event: EventDoc;

	let newMembers: BasicUser[] = [];
	let newPlace = 1;
	let newRubric: File[] = [];
	let fileInput: HTMLInputElement;
	let newResultDialogOpen = false;

	const comboboxUsers = $allUsersCollection.map((u) => ({
		value: u.email,
		label: u.name,
	}));

	let comboboxOpen = false;
	let comboboxValue = '';

	$: comboboxSelectedValue =
		comboboxUsers.find((f) => f.value === comboboxValue)?.label ??
		'Select a member...';

	function closeAndFocusTrigger(triggerId: string) {
		comboboxOpen = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
</script>

<Dialog.Root>
	<Dialog.Trigger>
		<Button>Add</Button>
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Title>Add Results</Dialog.Title>
		<Label class="flex flex-col gap-2">
			<span>Place</span>
			<Input bind:value={newPlace} type="number" />
		</Label>
		<p>Members</p>
		{#each newMembers as member}
			<div class="flex gap-2">
				<span>{member.name}</span>
				<Button
					variant="destructive"
					on:click={() => {
						newMembers = newMembers.filter((m) => m.email !== member.email);
					}}
				>
					Remove
				</Button>
			</div>
		{/each}
		<!-- <Command -->
		<Button on:click={() => fileInput.click()}>Upload Rubric(s)</Button>
		<input
			bind:this={fileInput}
			type="file"
			multiple
			class="hidden"
			on:change={async (e) => {
				if (!(e.target instanceof HTMLInputElement)) return;
				if (!e.target.files) return;
				newRubric = Array.from(e.target.files);

				if (event.results.find((r) => r.place === newPlace)) {
					for (const result of event.results) {
						if (result.place >= newPlace) {
							result.place++;
						}
					}
				}

				await setDoc(
					doc(db, 'events', event.event),
					{
						results: [
							...event.results,
							{
								place: newPlace,
								members: newMembers,
								rubric: newRubric.map((f) => f.name),
							},
						],
					},
					{ merge: true },
				);
				for (const file of newRubric) {
					await uploadBytes(
						ref(storage, `events/${event.event}/results/${file.name}`),
						file,
					);
				}
			}}
		/>
	</Dialog.Content>
</Dialog.Root>
