<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Progress } from '$lib/components/ui/progress';
	import { Textarea } from '$lib/components/ui/textarea';
	import { db } from '$lib/firebase';
	import { allUsersCollection, user } from '$lib/stores';
	import type { BasicUser, EventDoc } from '$lib/types';
	import { doc, setDoc } from 'firebase/firestore';
	import { deleteObject } from 'firebase/storage';
	import Minus from 'lucide-svelte/icons/minus';
	import Combobox from '$lib/Combobox.svelte';
	import Pencil from 'lucide-svelte/icons/pencil';
	import X from 'lucide-svelte/icons/x';
	import { type Snippet } from 'svelte';
	import { writable } from 'svelte/store';
	import { DownloadURL, StorageList, UploadTask } from 'sveltefire';
	import { sleep } from '$lib/better-utils';

	let {
		event,
		editing = false,
		edit,
		add,
		id = crypto.randomUUID(),
		onOpenChange,
		members,
	}: {
		edit?: Snippet<
			[
				{
					props: Record<string, unknown>;
				},
			]
		>;
		add?: Snippet<
			[
				{
					props: Record<string, unknown>;
				},
			]
		>;
		event: EventDoc;
		editing?: boolean;
		id?: string;
		onOpenChange?: ((open: boolean) => void) | undefined;
		members?: BasicUser[] | undefined;
	} = $props();

	let open = $state(false);

	const existingResults = event.results?.find((r) => r.id === id);
	let note = $state(editing ? (existingResults?.note ?? '') : '');
	let newPlace = $state(
		editing && existingResults
			? (event.results?.indexOf(existingResults) ?? 0) + 1
			: (event?.results?.length ?? 0) + 1,
	);

	let newMembers = $state(
		members ?? (editing ? (existingResults?.members ?? []) : []),
	);
	let fileInput = $state<HTMLInputElement>();
	const filesToUpload = writable<File[]>([]);

	let comboboxUsers = $derived(
		$allUsersCollection.map((u) => ({
			label: u.name,
			value: u.name,
		})),
	);

	let comboboxValue = $state('');

	let dummyVariableToRerender = $state(0);
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
		{#snippet child({ props })}
			{#if editing}
				{#if edit}
					{@render edit({ props })}
				{:else}
					<Button variant="ghost" size="icon" class="h-6" {...props}>
						<Pencil />
					</Button>
				{/if}
			{:else if add}
				{@render add({ props })}
			{:else}
				<Button id={id.replaceAll('-', '').replace(/\d/, '')} {...props}>
					Add
				</Button>
			{/if}
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Title>Add Results</Dialog.Title>
		<Label class="flex flex-col gap-2">
			<span>Place</span>
			<Input bind:value={newPlace} type="number" />
		</Label>
		<p>Members</p>
		{#each newMembers as member}
			<div class="flex items-center gap-2">
				<span>{member.name}</span>
				<Button
					variant="ghost"
					class="h-6"
					size="icon"
					onclick={() => {
						newMembers = newMembers.filter((m) => m.email !== member.email);
					}}
				>
					<Minus />
				</Button>
			</div>
		{/each}
		<Combobox
			bind:value={comboboxValue}
			options={comboboxUsers}
			onSelect={(selected) => {
				const newUser = $allUsersCollection.find(
					(u) => u.name === selected.value,
				)!;
				newMembers.push({
					name: newUser.name,
					email: newUser.email,
				});
				comboboxValue = '';
			}}
		/>
		<!-- <Popover.Root bind:open={comboboxOpen} let:ids>
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
			<Popover.Content class="max-h-32 w-[200px] p-0">
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
		</Popover.Root> -->
		{#key dummyVariableToRerender}
			<StorageList ref="results/{event.event}/{id}" let:list>
				<ul>
					{#each [...(list?.items ?? []), ...$filesToUpload] as submission}
						<li class="flex w-full flex-col items-center">
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
								<div class="flex w-full flex-row items-center">
									<DownloadURL ref={submission} let:link>
										<a href={link} target="_blank">
											{submission.name}
										</a>
									</DownloadURL>
									<div class="flex grow"></div>
									<Button
										variant="ghost"
										size="icon"
										onclick={async () => {
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
					onchange={(e) => {
						if (e.target instanceof HTMLInputElement) {
							if (!e.target.files?.length) return;
							const files = [...(e.target.files as unknown as File[])];
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

		<Textarea bind:value={note} placeholder="Add note..." />

		<Dialog.Footer>
			<Button variant="outline" onclick={() => fileInput?.click()}>
				Upload rubric
			</Button>
			{#if editing}
				<Button
					onclick={async () => {
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
								lastUpdatedBy: $user?.email ?? '',
							},
							{
								merge: true,
							},
						);
						id = crypto.randomUUID();
						note = '';
						onOpenChange?.(false);
						open = false;
					}}
				>
					Save
				</Button>
			{:else}
				<Button
					onclick={async () => {
						event.results = [
							...(event.results?.slice(0, newPlace - 1) ?? []),
							{
								members: newMembers.map((m) => ({
									name: m.name,
									email: m.email.includes('/')
										? m.email.split('/')[0]
										: m.email,
								})),
								rubricPaths: [`results/${event.event}/${id}`],
								note,
								id: id as ReturnType<typeof crypto.randomUUID>,
							},
							...(event.results?.slice(newPlace - 1) ?? []),
						];
						await setDoc(
							doc(db, 'events', event.event),
							{
								results: event.results,
								lastUpdatedBy: $user?.email ?? '',
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
							`#${CSS.escape(id.replaceAll('-', '').replace(/\d/, ''))}`,
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
