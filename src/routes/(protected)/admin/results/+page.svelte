<script lang="ts">
	import {
		db,
		eventsCollection,
		storage,
		user,
		allUsersCollection,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { doc, setDoc } from 'firebase/firestore';
	import { ref, uploadBytes } from 'firebase/storage';
	import { tick } from 'svelte';

	let newMembers = [];
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

<div class="container my-4">
	<h2
		class="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		Elimination Results
	</h2>

	<div
		class="grid items-center w-full gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 lg:items-start"
	>
		{#each $eventsCollection as event}
			<Card.Root>
				<Card.Header>
					<Card.Title>
						{event.event}
					</Card.Title>
				</Card.Header>
				<Card.Content>
					{#if event.results}
						<ol class="my-6 ml-6 [&>li]:mt-2">
							{#each event.results.sort((a, b) => a.place - b.place) as result}
								<li>
									{result}
									{#if result.members
										.map((u) => u.email.toLowerCase())
										.includes($user.email?.toLowerCase() ?? '')}
										<span class="text-gray-500"> (you)</span>
									{/if}
								</li>
							{/each}
						</ol>
					{:else}
						<p class="text-gray-500">No results posted yet</p>
					{/if}
				</Card.Content>
				<Card.Footer>
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
							<!-- <Command -->
							<Button on:click={() => fileInput.click()}>
								Upload Rubric(s)
							</Button>
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
													members: newMembers.split(',').map((m) => m.trim()),
													rubric: newRubric.map((f) => f.name),
												},
											],
										},
										{ merge: true },
									);
									for (const file of newRubric) {
										await uploadBytes(
											ref(
												storage,
												`events/${event.event}/results/${file.name}`,
											),
											file,
										);
									}
								}}
							/>
						</Dialog.Content>
					</Dialog.Root>
				</Card.Footer>
			</Card.Root>
		{/each}
	</div>
</div>
