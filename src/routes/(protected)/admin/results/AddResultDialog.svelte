<script lang="ts">
	import {
		allUsersCollection,
		db,
		storage,
		type BasicUser,
		type EventDoc,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { doc, setDoc } from 'firebase/firestore';
	import { getBlob, ref, uploadBytes } from 'firebase/storage';
	import { Check, ChevronsUpDown, Minus } from 'lucide-svelte';
	import { onMount, tick } from 'svelte';

	export let event: EventDoc;
	export let editing = false;
	export let newPlace = (event?.results?.length ?? 0) + 1;

	const existingResults = event.results.find((r) => r.place === newPlace);

	let newMembers: BasicUser[] =
		editing && existingResults ? existingResults.members : [];
	let newRubric: File[] = [];
	let fileInput: HTMLInputElement;

	$: comboboxUsers = $allUsersCollection.map((u) => ({
		value: `${u.email}/${u.name}`,
		label: u.name,
	}));

	let comboboxOpen = false;
	let comboboxValue = '';

	$: comboboxSelectedValue =
		comboboxUsers.find((f) => f.value === comboboxValue)?.label ??
		'Select a member...';

	$: if (comboboxValue) {
		const newMember = comboboxUsers.find((f) => f.value === comboboxValue);
		newMembers = [
			...newMembers,
			{
				name: newMember?.label ?? '',
				email: newMember?.value ?? '',
			},
		];
		comboboxValue = '';
	}

	function closeAndFocusTrigger(triggerId: string) {
		comboboxOpen = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}

	onMount(async () => {
		if (editing && existingResults) {
			newRubric = await Promise.all(
				existingResults.rubricPaths.map(
					async (r) =>
						new File([await getBlob(ref(storage, r))], ref(storage, r).name),
				),
			);
		}
	});
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
			<div class="flex gap-2 items-center">
				<span>{member.name}</span>
				<Button
					variant="ghost"
					class="h-6"
					size="icon"
					on:click={() => {
						newMembers = newMembers.filter((m) => m.email !== member.email);
					}}
				>
					<Minus />
				</Button>
			</div>
		{/each}
		<Popover.Root
			positioning={{
				placement: 'bottom',
			}}
			bind:open={comboboxOpen}
			let:ids
		>
			<Popover.Trigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="outline"
					role="combobox"
					aria-expanded={comboboxOpen}
					class="w-[200px] justify-between"
				>
					{comboboxSelectedValue}
					<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-[200px] max-h-32 p-0">
				<Command.Root>
					<Command.Input placeholder="Search members..." />
					<Command.Empty>No members found.</Command.Empty>
					<Command.Group>
						{#each comboboxUsers as user}
							<Command.Item
								value={user.value}
								onSelect={(currentValue) => {
									comboboxValue = currentValue;
									closeAndFocusTrigger(ids.trigger);
								}}
							>
								<Check
									class={cn(
										'mr-2 h-4 w-4',
										comboboxSelectedValue !== user.value && 'text-transparent',
									)}
								/>
								{user.label}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
		<Button on:click={() => fileInput.click()}>Upload Rubric(s)</Button>
		<input
			bind:this={fileInput}
			type="file"
			multiple
			class="hidden"
			on:change={async (e) => {
				if (!(e.target instanceof HTMLInputElement)) return;
				if (!e.target.files) return;
				newRubric.push(...e.target.files);

				for (const file of e.target.files) {
					await uploadBytes(
						ref(storage, `events/${event.event}/results/${file.name}`),
						file,
					);
				}
			}}
		/>
		<Dialog.Footer>
			<Button
				on:click={async () => {
					await setDoc(
						doc(db, 'events', event.event),
						{
							results: [
								...(event.results ?? []),
								{
									place: newPlace,
									members: newMembers.map((m) => ({
										name: m.name,
										email: m.email.includes('/')
											? m.email.split('/')[0]
											: m.email,
									})),
									rubricPaths: newRubric.map(
										(f) => `/events/${event.event}/results/${f.name}`,
									),
								},
							],
						},
						{
							merge: true,
						},
					);
					if (event.results.find((r) => r.place === newPlace)) {
						for (const result of event.results) {
							if (result.place >= newPlace) {
								result.place++;
							}
						}
					}
					newMembers = [];
					newPlace++;
					newRubric = [];
				}}
			>
				Add
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
