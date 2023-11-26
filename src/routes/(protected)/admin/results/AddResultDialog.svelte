<script lang="ts">
	import { allUsersCollection, db, type BasicUser, type EventDoc } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { Progress } from '$lib/components/ui/progress';
	import { cn, sleep } from '$lib/utils';
	import { doc, setDoc } from 'firebase/firestore';
	import { deleteObject } from 'firebase/storage';
	import { Check, ChevronsUpDown, Minus, Pencil, X } from 'lucide-svelte';
	import { tick } from 'svelte';
	import { writable } from 'svelte/store';
	import { DownloadURL, StorageList, UploadTask } from 'sveltefire';

	export let event: EventDoc;
	export let editing = false;
	export let id = crypto.randomUUID();
	export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
	export let members: BasicUser[] | undefined = undefined;

	let open = false;

	const existingResults = event.results?.find((r) => r.id === id)!;
	let note = editing ? existingResults?.note ?? '' : '';
	let newPlace = editing
		? (event.results?.indexOf(existingResults) ?? 0) + 1
		: (event?.results?.length ?? 0) + 1;

	let newMembers: BasicUser[];
	$: newMembers = members ?? (editing ? existingResults?.members ?? [] : []);
	let fileInput: HTMLInputElement;
	const filesToUpload = writable<File[]>([]);

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

	let dummyVariableToRerender = 0;
	const updateStorageList = () => {
		dummyVariableToRerender++;
		return '';
	};
	const filterSubmissions = (submission: File) => {
		$filesToUpload = $filesToUpload.filter((f) => f !== submission);
		return '';
	};
</script>

<Dialog.Root
	bind:open
	onOpenChange={(e) => {
		onOpenChange?.(e);
	}}
>
	<Dialog.Trigger>
		{#if editing}
			{#if $$slots.edit}
				<slot name="edit" />
			{:else}
				<Button variant="ghost" size="icon" class="h-6">
					<Pencil />
				</Button>
			{/if}
		{:else if $$slots.add}
			<slot name="add" />
		{:else}
			<Button id={id.replaceAll('-', '').replace(/[0-9]/, '')}>Add</Button>
		{/if}
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
		{#key dummyVariableToRerender}
			<StorageList ref="results/{event.event}/{id}" let:list>
				<ul>
					{#each [...(list?.items ?? []), ...$filesToUpload] as submission}
						<li class="w-full flex flex-col items-center">
							{#if submission instanceof File}
								<UploadTask
									ref="results/{event.event}/{id}/{submission.name}"
									data={submission}
									let:snapshot
									let:progress
								>
									{#if snapshot?.state === 'success'}
										{filterSubmissions(submission)}
										{updateStorageList()}
									{:else}
										<Progress value={progress} class="w-full" />

										<span class="w-full">
											{submission.name}
										</span>
									{/if}
								</UploadTask>
							{:else}
								<div class="flex flex-row w-full items-center">
									<DownloadURL ref={submission} let:link>
										<a href={link} target="_blank">
											{submission.name}
										</a>
									</DownloadURL>
									<div class="flex flex-grow" />
									<Button
										variant="ghost"
										size="icon"
										on:click={async () => {
											if (submission instanceof File) return;
											await deleteObject(submission);
											dummyVariableToRerender++;
										}}
									>
										<X />
									</Button>
								</div>
							{/if}
						</li>
					{:else}
						<p>No submissions</p>
					{/each}
				</ul>

				<input
					bind:this={fileInput}
					on:change={(e) => {
						if (e.target instanceof HTMLInputElement) {
							if (!e.target.files?.length) return;
							const files = [...e.target.files];
							for (const file of files) {
								if (list?.items.map((f) => f.name).includes(file.name)) {
									alert(
										`File ${file.name} already exists. If you want to upload this file, change the name.`,
									);
									continue;
								}

								$filesToUpload.push(file);
								$filesToUpload = $filesToUpload;
							}
						}
					}}
					class="hidden"
					type="file"
					multiple
				/>
			</StorageList>
		{/key}

		<Input bind:value={note} placeholder="Add note..." />

		<Dialog.Footer>
			<Button variant="outline" on:click={() => fileInput.click()}>
				Upload rubric
			</Button>
			{#if editing}
				<Button
					on:click={async () => {
						await setDoc(
							doc(db, 'events', event.event),
							{
								results: event.results?.map((r) =>
									r.id === id
										? {
												place: newPlace,
												members: newMembers.map((m) => ({
													name: m.name,
													email: m.email.includes('/')
														? m.email.split('/')[0]
														: m.email,
												})),
												note,
												id,
										  }
										: r,
								),
							},
							{
								merge: true,
							},
						);
						id = crypto.randomUUID();
						open = false;
						onOpenChange?.(false);
					}}
				>
					Save
				</Button>
			{:else}
				<Button
					on:click={async () => {
						event.results = [
							...(event.results?.slice(0, newPlace - 1) ?? []),
							{
								members: newMembers.map((m) => ({
									name: m.name,
									email: m.email.includes('/')
										? m.email.split('/')[0]
										: m.email,
								})),
								rubricPaths: $filesToUpload.map(
									(f) => `results/${event.event}/${id}/${f.name}`,
								),
								note,
								id,
							},
							...(event.results?.slice(newPlace - 1) ?? []),
						];
						await setDoc(
							doc(db, 'events', event.event),
							{
								results: event.results,
							},
							{
								merge: true,
							},
						);

						newMembers = [];
						newPlace++;
						id = crypto.randomUUID();
						open = false;
						const el = document.querySelector(
							`#${id.replaceAll('-', '').replace(/[0-9]/, '')}`,
						);

						if (el instanceof HTMLButtonElement)
							sleep(200).then(() => el.focus());
					}}
				>
					Add
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
