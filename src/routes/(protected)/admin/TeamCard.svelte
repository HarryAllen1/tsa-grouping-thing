<script lang="ts">
	import { fancyConfirm } from '$lib/FancyConfirm.svelte';
	import SimpleTooltip from '$lib/SimpleTooltip.svelte';
	import StorageMetadata from '$lib/StorageMetadata.svelte';
	import { sleep } from '$lib/better-utils';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Progress } from '$lib/components/ui/progress';
	import { Switch } from '$lib/components/ui/switch';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import {
		CHAPTER_ID,
		POINT_OF_CONTACT_EMAIL,
		POINT_OF_CONTACT_NAME,
	} from '$lib/constants';
	import { db, storage } from '$lib/firebase';
	import { md } from '$lib/md';
	import { allUsersCollection, user, userDoc } from '$lib/stores';
	import type { EventDoc, Team } from '$lib/types';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import Crown from '@lucide/svelte/icons/crown';
	import FileUp from '@lucide/svelte/icons/file-up';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import Mail from '@lucide/svelte/icons/mail';
	import Minus from '@lucide/svelte/icons/minus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import X from '@lucide/svelte/icons/x';
	import confetti from 'canvas-confetti';
	import { Timestamp, doc, updateDoc } from 'firebase/firestore';
	import {
		deleteObject,
		ref,
		uploadBytes,
		type FullMetadata,
	} from 'firebase/storage';
	import { toast } from 'svelte-sonner';
	import { flip } from 'svelte/animate';
	import { DownloadURL, StorageList, UploadTask } from 'sveltefire';
	import CardboardBoatDialog from '../../CardboardBoatDialog.svelte';
	import { openUserDialog } from './user-dialog';

	let { team, event }: { team: Team; event: EventDoc } = $props();

	let submissionsFileUpload = $state<HTMLInputElement>();
	let filesToUpload = $state<File[]>([]);

	let dummyVariableToRerender = $state(0);
	const updateStorageList = () => {
		dummyVariableToRerender++;
		return '';
	};
	const filterSubmissions = (submission: File) => {
		filesToUpload = filesToUpload.filter((f) => f !== submission);
		return '';
	};

	let teamDialogOpen = $state(false);

	let dropping = $state(false);

	const entryIsFile = (entry: FileSystemEntry): entry is FileSystemFileEntry =>
		entry.isFile;
	const entryIsDir = (
		entry: FileSystemEntry,
	): entry is FileSystemDirectoryEntry => entry.isDirectory;

	const handleFileDrop = (e: DragEvent, event: string, team: string) => {
		e.preventDefault();
		dropping = false;
		toast.promise(
			async () =>
				new Promise((res, rej) => {
					const data = e.dataTransfer;
					if (!data) return rej('No data');
					const { items } = data;
					const files: File[] = [];

					const traverseFileTree = (
						item: FileSystemEntry,
						path: string = '',
					) => {
						if (entryIsFile(item)) {
							item.file((file) => {
								files.push(file);
							});
						} else if (entryIsDir(item)) {
							// Get folder contents
							const dirReader = item.createReader();
							dirReader.readEntries((entries) => {
								for (const entry of entries) {
									traverseFileTree(entry, `${path}${item.name}/`);
								}
							});
						}
					};

					for (const item of items as unknown as DataTransferItem[]) {
						const entry = item.webkitGetAsEntry();

						if (entry) {
							traverseFileTree(entry);
						}
					}
					sleep(1000).then(() => {
						const refs = files.map(
							(f) =>
								[ref(storage, `files/${event}/${team}/${f.name}`), f] as const,
						);
						Promise.all(refs.map((r) => uploadBytes(r[0], r[1])))
							.then(() => {
								dummyVariableToRerender++;
								res('Uploaded!');
							})
							.catch((error) => {
								dummyVariableToRerender++;
								rej(String(error));
							});
					});
				}),
			{
				loading: 'Uploading...',
				success: 'Uploaded!',
				error: (d) => (typeof d === 'string' ? d : 'Failed to upload'),
			},
		);
	};

	let submissionsUpdater = $state(0);
</script>

<Card.Root
	ondrop={(e) => {
		e.preventDefault();
		handleFileDrop(e as unknown as DragEvent, event.event, team.id);
	}}
	ondragover={(e) => {
		e.preventDefault();
		dropping = true;
	}}
	ondragleave={(e) => {
		e.preventDefault();
		dropping = false;
	}}
	class="{team.members.length > event.maxTeamSize ||
	team.members.length < event.minTeamSize
		? 'bg-red-300/20 dark:bg-red-950'
		: team.members.length === event.maxTeamSize
			? 'bg-green-300/20 dark:bg-green-950'
			: 'bg-black/5 dark:bg-white/5'} relative"
>
	{#if dropping}
		<div
			class="pointer-events-none absolute z-50 flex h-full w-full items-center justify-center rounded-md border-2 border-dashed bg-black/20 p-4 py-8"
		>
			<FileUp class="h-16 w-16" />
		</div>
	{/if}
	<Card.Header>
		<Card.Title class="flex flex-row items-center">
			<span>
				{#if event.event === '*Rooming'}
					Room #{team.teamNumber}
				{:else if event.event === '*Cardboard Boat'}
					{team.teamName || '(no team name)'}
				{:else if event.maxTeamSize === 1 && team.members.length === 1}
					Team {$allUsersCollection.find(
						(u) =>
							u.email.toLowerCase() === team.members[0].email.toLowerCase(),
					)?.washingtonId}
				{:else}
					Team {CHAPTER_ID}-{team.teamNumber}
				{/if}
			</span>
			{#if event.event !== '*Cardboard Boat'}
				<Dialog.Root bind:open={teamDialogOpen}>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button size="sm" variant="ghost" class="ml-2" {...props}>
								<Pencil />
							</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Title
							>Edit {event.event === '*Rooming' ? 'room' : 'team'} number</Dialog.Title
						>
						<div class="flex w-full max-w-sm flex-col gap-1.5">
							<Label for="teamNumber"
								>{event.event === '*Rooming' ? 'Room' : 'Team'} Number</Label
							>
							<Input
								type="number"
								id="teamNumber"
								placeholder="1"
								value={team.teamNumber}
							/>
						</div>
						<Dialog.Footer>
							<Button
								onclick={async () => {
									const el = document.querySelector('#teamNumber');
									if (el instanceof HTMLInputElement) {
										await updateDoc(doc(db, 'events', event.event ?? ''), {
											teams: event.teams.map((t) =>
												t.id === team.id
													? {
															...t,
															teamNumber: el.valueAsNumber,
														}
													: t,
											),
											lastUpdatedBy: $user?.email ?? '',
										});
										teamDialogOpen = false;
									}
								}}
							>
								Save
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			{:else}
				<CardboardBoatDialog teamId={team.id} {event} />
			{/if}
			<div class="grow"></div>
			<Button
				variant="destructive"
				size="icon"
				onclick={async () => {
					if (
						!(await fancyConfirm(
							'Are you sure',
							'Are you sure you want to delete this team? This action is irreversible.',
						))
					)
						return;
					event.teams = event.teams.filter((t) => t !== team);
					await updateDoc(doc(db, 'events', event.event ?? ''), {
						teams: event.teams,
						lastUpdatedBy: $user?.email ?? '',
					});
				}}
			>
				<Trash2 />
			</Button>
		</Card.Title>
		<div class="flex flex-col gap-2">
			<div class="flex flex-row gap-1">
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button
								size="icon"
								class="bg-green-500 hover:bg-green-400"
								{...props}
							>
								<UserPlus />
							</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content class="max-h-full overflow-y-scroll">
						<Dialog.Title>Add People</Dialog.Title>
						<Dialog.Description>
							All people not already in a team:
						</Dialog.Description>
						<ul>
							{#each $allUsersCollection
								.filter((p) => !event.teams.some( (t) => t.members?.find((e) => e.email.toLowerCase() === p.email?.toLowerCase()), ))
								.sort((a, b) => a?.name?.localeCompare(b?.name))
								.filter( (m) => (event.event === '*Rooming' ? m.events.length > 0 : true), ) as person (person.email)}
								<li
									class={[
										'flex flex-row items-center',
										$allUsersCollection
											.filter((m) => m.events.includes(event.event ?? ''))
											.find((e) => e.email === (person?.email ?? '')) &&
											'text-green-600',
									]}
									animate:flip={{
										duration: 200,
									}}
								>
									<button onclick={() => openUserDialog(person.email)}>
										{person.name}
									</button>
									<Button
										onclick={async () => {
											team.members.push({
												name: person.name,
												email: person.email,
											});
											team.lastUpdatedBy = $user?.email ?? '';
											team.lastUpdatedTime = new Timestamp(
												Date.now() / 1000,
												0,
											);

											await updateDoc(doc(db, 'events', event.event ?? ''), {
												teams: event.teams,
												lastUpdatedBy: $user?.email ?? '',
											});
											confetti();

											navigator.vibrate(100);
										}}
										variant="outline"
										size="icon"
										class="ml-2"
									>
										<Plus />
									</Button>
								</li>
							{:else}
								<li>
									No one else singed up for this event. Teams should probably be
									merged.
								</li>
							{/each}
						</ul>
					</Dialog.Content>
				</Dialog.Root>
				<Button
					size="icon"
					href="mailto:{team.members.map((p) => p.email).join(';')}"
				>
					<Mail />
				</Button>
				{#if event.event !== '*Rooming' && event.maxTeamSize > 1}
					<Dialog.Root>
						<Dialog.Trigger>
							{#snippet child({ props })}
								<Button {...props}>Team Captain</Button>
							{/snippet}
						</Dialog.Trigger>
						<Dialog.Content>
							<Dialog.Title>Manage team captain</Dialog.Title>
							<Button
								onclick={async () => {
									team.teamCaptain = '';
									team.lastUpdatedBy = $user?.email ?? '';
									team.lastUpdatedTime = new Timestamp(Date.now() / 1000, 0);
									await updateDoc(doc(db, 'events', event.event ?? ''), {
										teams: event.teams,
										lastUpdatedBy: $user?.email ?? '',
									});
								}}
							>
								Clear
							</Button>
							<ul>
								{#each team.members as teamMember (teamMember.email)}
									<li>
										<button
											onclick={async () => {
												team.teamCaptain = teamMember?.email ?? '';
												team.lastUpdatedBy = $user?.email ?? '';
												team.lastUpdatedTime = new Timestamp(
													Date.now() / 1000,
													0,
												);
												await updateDoc(doc(db, 'events', event.event ?? ''), {
													teams: event.teams,
													lastUpdatedBy: $user?.email ?? '',
												});
											}}
										>
											{teamMember.name}
										</button>
										{#if team.teamCaptain?.toLowerCase() === teamMember.email.toLowerCase()}
											<Tooltip.Root>
												<Tooltip.Trigger>
													<Crown class="h-4 w-4" />
												</Tooltip.Trigger>
												<Tooltip.Content>Team captain</Tooltip.Content>
											</Tooltip.Root>
										{/if}
									</li>
								{/each}
							</ul>
						</Dialog.Content>
					</Dialog.Root>
				{/if}
			</div>

			<div>
				<Label class="flex flex-row items-center gap-2">
					<Switch
						onCheckedChange={async (checked) => {
							team.locked = checked;
							team.lastUpdatedBy = $user?.email ?? '';
							team.lastUpdatedTime = new Timestamp(Date.now() / 1000, 0);
							await updateDoc(doc(db, 'events', event.event ?? ''), {
								teams: event.teams,
								lastUpdatedBy: $user?.email ?? '',
							});
						}}
						checked={team.locked ?? false}
					/>
					Lock team
				</Label>
			</div>
			<div>
				<Label class="flex flex-row items-center gap-2">
					<Switch
						onCheckedChange={async (checked) => {
							team.random = checked;
							team.lastUpdatedBy = $user?.email ?? '';
							team.lastUpdatedTime = new Timestamp(Date.now() / 1000, 0);
							await updateDoc(doc(db, 'events', event.event ?? ''), {
								teams: event.teams,
								lastUpdatedBy: $user?.email ?? '',
							});
						}}
						checked={team.random ?? false}
					/>
					Random switch
				</Label>
			</div>
			{#if event.event !== '*Rooming'}
				<div>
					<Dialog.Root>
						{#key dummyVariableToRerender}
							<StorageList ref="submissions/{event.event}/{team.id}" let:list>
								<Dialog.Trigger>
									{#snippet child({ props })}
										<Button {...props}>
											Manage Submissions {list?.items.length
												? `(${list.items.length})`
												: ''}
										</Button>
									{/snippet}
								</Dialog.Trigger>
								<Dialog.Content
									interactOutsideBehavior="ignore"
									class="max-h-screen overflow-y-auto"
								>
									<Dialog.Title>Manage Submissions</Dialog.Title>
									<Button
										onclick={() => {
											submissionsUpdater++;
										}}
										variant="outline">Refresh</Button
									>
									{#if event.submissionDescription}
										<div class="prose dark:prose-invert dark:text-white">
											<!-- eslint-disable-next-line svelte/no-at-html-tags -->
											{@html md.render(
												`## What needs to be submitted:\n\n${event.submissionDescription}`,
											)}
										</div>
									{/if}
									<ul>
										{#key submissionsUpdater}
											{#each [...(list?.items ?? []), ...filesToUpload] as submission (submission instanceof File ? submission.webkitRelativePath : submission.fullPath)}
												<li class="flex w-full flex-col items-center">
													{#if submission instanceof File}
														<UploadTask
															metadata={{
																customMetadata: {
																	teamId: team.id,
																	userEmail: $user?.email ?? '',
																	userName: $userDoc?.name ?? '',
																},
															}}
															ref="submissions/{event.event}/{team.id}/{submission.name}"
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
																<StorageMetadata
																	ref={submission}
																	link={link ?? ''}
																>
																	{#snippet withMetadata(
																		link: string,
																		meta: FullMetadata,
																	)}
																		<SimpleTooltip
																			message={new Date(
																				meta.timeCreated,
																			).toLocaleString()}
																		>
																			<a href={link} target="_blank">
																				{meta.name}
																			</a>
																		</SimpleTooltip>
																	{/snippet}
																</StorageMetadata>
															</DownloadURL>
															<div class="flex grow"></div>
															<Button
																variant="ghost"
																size="icon"
																onclick={async () => {
																	if (submission instanceof File) return;
																	await deleteObject(submission);
																	team.lastUpdatedBy = $user?.email ?? '';
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
										{/key}
									</ul>
									<Button
										class="mt-4"
										onclick={() => submissionsFileUpload?.click()}
									>
										Upload
									</Button>
									<input
										bind:this={submissionsFileUpload}
										onchange={(e) => {
											if (e.target instanceof HTMLInputElement) {
												if (!e.target.files?.length) return;
												const files = [
													...(e.target.files as unknown as File[]),
												];
												for (const file of files) {
													if (
														list?.items.map((f) => f.name).includes(file.name)
													) {
														alert(
															`File ${file.name} already exists. If you want to upload this file, change the name.`,
														);
														continue;
													}

													filesToUpload.push(file);
												}
											}
										}}
										class="hidden"
										type="file"
										multiple
									/>

									<p>
										Allowed file types: all image files, all audio files, all
										video files, PDFs, and Word docs (.doc, .docx).
									</p>
									<p>250MB max file size.</p>
									<p>
										If you need to submit a file type not listed, please contact
										{POINT_OF_CONTACT_NAME} (<a
											href="mailto:{POINT_OF_CONTACT_EMAIL}"
											>{POINT_OF_CONTACT_EMAIL}</a
										>).
									</p>
								</Dialog.Content>
							</StorageList>
						{/key}
					</Dialog.Root>
				</div>
			{/if}
		</div>
	</Card.Header>
	<Card.Content>
		<div class="mb-4">
			<Collapsible.Root>
				<Collapsible.Trigger>
					{#snippet child({ props })}
						<Button
							variant="ghost"
							size="sm"
							class="flex w-full items-center p-2"
							{...props}
						>
							Manage Requests {#if team.requests?.length}
								({team.requests.length})
							{/if}
							<div class="flex-1"></div>
							<ChevronsUpDown />
						</Button>
					{/snippet}
				</Collapsible.Trigger>
				<Collapsible.Content class="px-2">
					<ul>
						{#each team.requests ?? [] as request}
							<li class="flex flex-row">
								<button onclick={() => openUserDialog(request.email)}>
									{request.name}
								</button>
								<Button
									onclick={async () => {
										team.members.push({
											name: request.name,
											email: request.email,
										});
										team.lastUpdatedBy = $user?.email ?? '';
										team.lastUpdatedTime = new Timestamp(Date.now() / 1000, 0);
										team.requests = team.requests?.filter(
											(r) =>
												r.email !== request.email && r.name !== request.name,
										);
										await updateDoc(doc(db, 'events', event.event ?? ''), {
											teams: event.teams,
											lastUpdatedBy: $user?.email ?? '',
										});
										confetti();

										navigator.vibrate(100);
									}}
									size="icon"
									class="h-5"
									variant="ghost"
								>
									<Plus />
								</Button>
								<Button
									size="icon"
									class="h-5"
									variant="ghost"
									onclick={async () => {
										team.requests = team.requests?.filter(
											(r) =>
												r.email !== request.email && r.name !== request.name,
										);
										team.lastUpdatedBy = $user?.email ?? '';
										team.lastUpdatedTime = new Timestamp(Date.now() / 1000, 0);
										await updateDoc(doc(db, 'events', event.event ?? ''), {
											teams: event.teams,
											lastUpdatedBy: $user?.email ?? '',
										});
									}}
								>
									<Minus />
								</Button>
							</li>
						{:else}
							<li>No requests</li>
						{/each}
						<Dialog.Root>
							<Dialog.Trigger>
								{#snippet child({ props })}
									<Button size="icon" {...props}>
										<Plus />
									</Button>
								{/snippet}
							</Dialog.Trigger>
							<Dialog.Content class="max-h-full overflow-y-scroll">
								<Dialog.Title>Create Request</Dialog.Title>

								<ul>
									{#each $allUsersCollection.filter((u) => !team.members
												.map((m) => m.email)
												.includes(u.email) && !team.requests
												?.map((r) => r.email)
												.includes(u.email)) as person (person.email)}
										<li
											class={[
												'flex flex-row items-center',
												$allUsersCollection
													.filter((m) => m.events.includes(event.event ?? ''))
													.find((e) => e.email === (person?.email ?? '')) &&
													'text-green-500',
											]}
											animate:flip={{
												duration: 200,
											}}
										>
											<button onclick={() => openUserDialog(person.email)}>
												{person.name}
											</button>
											<Button
												onclick={async () => {
													team.requests = [
														...(team.requests ?? []),
														{
															name: person.name,
															email: person.email,
														},
													];
													team.lastUpdatedBy = $user?.email ?? '';
													team.lastUpdatedTime = new Timestamp(
														Date.now() / 1000,
														0,
													);
													await updateDoc(
														doc(db, 'events', event.event ?? ''),
														{
															teams: event.teams,
															lastUpdatedBy: $user?.email ?? '',
														},
													);

													confetti();

													navigator.vibrate(100);
												}}
												variant="outline"
												size="icon"
												class="ml-2"
											>
												<Plus />
											</Button>
										</li>
									{:else}
										<li>how tf</li>
									{/each}
								</ul>
							</Dialog.Content>
						</Dialog.Root>
					</ul>
				</Collapsible.Content>
			</Collapsible.Root>
			<Collapsible.Root>
				{@const hash = `files-${team.id}`}
				<Collapsible.Trigger>
					{#snippet child({ props })}
						<Button
							variant="ghost"
							size="sm"
							class="flex w-full items-center p-2"
							{...props}
						>
							Manage Files
							<div class="flex-1"></div>
							<ChevronsUpDown />
						</Button>
					{/snippet}
				</Collapsible.Trigger>
				<Collapsible.Content class="px-2">
					{#key dummyVariableToRerender}
						<Alert.Root>
							<Lightbulb />
							<Alert.Title>Tip</Alert.Title>
							<Alert.Description>
								You can drag and drop files onto the team card to upload them.
							</Alert.Description>
						</Alert.Root>
						<StorageList ref="files/{event.event}/{team.id}" let:list>
							{#if list === null}
								<p>Loading...</p>
							{:else}
								<ul>
									{#each [...(list?.items ?? []), ...(filesToUpload[0] ? [filesToUpload[0]] : [])] as file}
										<li class="flex w-full flex-col items-center">
											{#if file instanceof File}
												<UploadTask
													ref="files/{event.event}/{team.id}/{file.name}"
													data={file}
													let:snapshot
													let:progress
												>
													{#if snapshot?.state === 'success'}
														{updateStorageList()}
														{filterSubmissions(file)}
													{:else}
														<Progress value={progress} class="w-full" />

														<span class="w-full">
															{file.name}
														</span>
													{/if}
												</UploadTask>
											{:else}
												<div class="flex w-full flex-row items-center">
													<DownloadURL ref={file} let:link>
														<StorageMetadata ref={file} link={link ?? ''}>
															{#snippet withMetadata(
																link: string,
																meta: FullMetadata,
															)}
																<SimpleTooltip
																	message={new Date(
																		meta.timeCreated,
																	).toLocaleString()}
																>
																	<a href={link} target="_blank">
																		{file.name}
																	</a>
																</SimpleTooltip>
															{/snippet}
														</StorageMetadata>
													</DownloadURL>
													<div class="flex grow"></div>
													<Button
														variant="ghost"
														size="icon"
														onclick={async () => {
															if (file instanceof File) return;
															await deleteObject(file);
															team.lastUpdatedBy = $user?.email ?? '';
															dummyVariableToRerender++;
														}}
													>
														<X />
													</Button>
												</div>
											{/if}
										</li>
									{:else}
										<p>No files</p>
									{/each}
								</ul>
								<Button
									class="mt-4"
									onclick={() => {
										const el = document.querySelector(`#${hash}`);
										if (el instanceof HTMLInputElement) el.click();
									}}
								>
									Upload
								</Button>
								<input
									id={hash}
									onchange={(e) => {
										if (e.target instanceof HTMLInputElement) {
											if (!e.target.files?.length) return;
											const files = [...(e.target.files as unknown as File[])];
											for (const file of files) {
												if (
													list?.items.map((f) => f.name).includes(file.name)
												) {
													alert(
														`File ${file.name} already exists. If you want to upload this file, change the name.`,
													);
													continue;
												}

												filesToUpload.push(file);
											}
										}
									}}
									class="hidden"
									type="file"
									multiple
								/>
							{/if}
						</StorageList>
					{/key}
				</Collapsible.Content>
			</Collapsible.Root>
		</div>
		<ul>
			{#each team.members as teamMember (teamMember.email)}
				<li
					class={[
						'flex flex-row items-center gap-2',
						$allUsersCollection
							.filter((m) => m.events.includes(event.event ?? ''))
							.find(
								(e) =>
									e.email?.toLowerCase() === teamMember.email.toLowerCase(),
							) && 'text-green-600 dark:text-green-500',
					]}
					animate:flip={{
						duration: 200,
					}}
				>
					<button
						onclick={() => openUserDialog(teamMember.email)}
						class="text-start"
					>
						{teamMember.name}
					</button>

					{#if team.teamCaptain?.toLowerCase() === teamMember.email.toLowerCase()}
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Crown class="h-4 w-4" />
							</Tooltip.Trigger>
							<Tooltip.Content>Team captain</Tooltip.Content>
						</Tooltip.Root>
					{/if}
					<Button
						size="icon"
						class="h-5"
						variant="ghost"
						onclick={async () => {
							team.members.splice(
								team.members.findIndex(
									(e) =>
										e.email === (teamMember?.email ?? '') &&
										e.name === (teamMember?.name ?? ''),
								),
								1,
							);
							team.lastUpdatedBy = $user?.email ?? '';
							await updateDoc(doc(db, 'events', event.event ?? ''), {
								teams: event.teams,
								lastUpdatedBy: $user?.email ?? '',
							});
						}}
					>
						<Minus />
					</Button>
				</li>
			{/each}
		</ul>
	</Card.Content>
</Card.Root>
