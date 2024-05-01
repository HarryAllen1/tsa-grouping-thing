<script lang="ts">
	import {
		SimpleTooltip,
		StorageMetadata,
		allUsersCollection,
		aww,
		db,
		fancyConfirm,
		md,
		storage,
		user,
		yay,
		type EventDoc,
		type Team,
	} from '$lib';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Progress } from '$lib/components/ui/progress';
	import { Switch } from '$lib/components/ui/switch';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { sleep } from '$lib/utils';
	import confetti from 'canvas-confetti';
	import { Timestamp, doc, setDoc } from 'firebase/firestore';
	import { deleteObject, ref, uploadBytes } from 'firebase/storage';
	import {
		ChevronsUpDown,
		Crown,
		FileUp,
		Lightbulb,
		Mail,
		Minus,
		Plus,
		Trash2,
		UserPlus,
		X,
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { flip } from 'svelte/animate';
	import { DownloadURL, StorageList, UploadTask } from 'sveltefire';
	import CardboardBoatDialog from '../../CardboardBoatDialog.svelte';
	import UserCard from './UserCard.svelte';

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

					for (const item of items) {
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
								res('Uploaded!');
							})
							.catch((e) => {
								rej(String(e));
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
		? 'bg-red-300  bg-opacity-20 dark:bg-red-950'
		: team.members.length === event.maxTeamSize
			? 'bg-green-300 dark:bg-green-950'
			: 'bg-black bg-opacity-5 dark:bg-white dark:bg-opacity-5'} relative"
>
	{#if dropping}
		<div
			class="pointer-events-none absolute z-50 flex h-full w-full items-center justify-center rounded-md border-2 border-dashed bg-black/20 p-4 py-8"
		>
			<FileUp class="h-16 w-16" />
		</div>
	{/if}
	<Card.Header>
		<Card.Title>
			{#if event.event === '*Rooming'}
				Room #{team.teamNumber}
			{:else if event.event === '*Cardboard Boat'}
				{team.teamName || '(no team name)'}
			{:else if event.maxTeamSize === 1 && team.members.length === 1}
				Team {$allUsersCollection.find(
					(u) => u.email.toLowerCase() === team.members[0].email.toLowerCase(),
				)?.washingtonId}
			{:else}
				Team 2082-{team.teamNumber}
			{/if}
			<Dialog.Root bind:open={teamDialogOpen}>
				<Dialog.Trigger>
					<Button>Edit</Button>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Title>Edit team number</Dialog.Title>
					<div class="flex w-full max-w-sm flex-col gap-1.5">
						<Label for="teamNumber">Team Number</Label>
						<Input
							type="number"
							id="teamNumber"
							placeholder="1"
							value={team.teamNumber}
						/>
					</div>
					<Dialog.Footer>
						<Button
							on:click={async () => {
								const el = document.querySelector('#teamNumber');
								if (el instanceof HTMLInputElement) {
									await setDoc(
										doc(db, 'events', event.event ?? ''),
										{
											teams: event.teams.map((t) =>
												t.id === team.id
													? {
															...t,
															teamNumber: el.valueAsNumber,
														}
													: t,
											),
											lastUpdatedBy: $user?.email ?? '',
										},
										{
											merge: true,
										},
									);
									teamDialogOpen = false;
								}
							}}
						>
							Save
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</Card.Title>
		<div class="flex flex-col gap-2">
			<div class="flex flex-row gap-1">
				<Button
					variant="destructive"
					size="icon"
					on:click={async () => {
						if (
							!(await fancyConfirm(
								'Are you sure',
								'Are you sure you want to delete this team? This action is irreversible.',
							))
						)
							return;
						event.teams = event.teams.filter((t) => t !== team);
						await setDoc(
							doc(db, 'events', event.event ?? ''),
							{
								teams: event.teams,
								lastUpdatedBy: $user?.email ?? '',
							},
							{
								merge: true,
							},
						);

						aww.play();
					}}
				>
					<Trash2 />
				</Button>
				<Dialog.Root>
					<Dialog.Trigger>
						<Button size="icon" class="bg-green-500 hover:bg-green-400">
							<UserPlus />
						</Button>
					</Dialog.Trigger>
					<Dialog.Content class="max-h-full overflow-y-scroll">
						<Dialog.Title>Add People</Dialog.Title>
						<Dialog.Description>
							<p>All people not already in a team:</p>
							<ul>
								{#each $allUsersCollection
									.filter((p) => !event.teams.find( (t) => t.members?.find((e) => e.email.toLowerCase() === p.email?.toLowerCase()), ))
									.sort((a, b) => a?.name?.localeCompare(b?.name))
									.filter( (m) => (event.event === '*Rooming' ? m.events.length > 0 : true), ) as person (person.email)}
									<li
										class:text-green-500={$allUsersCollection
											.filter((m) => m.events.includes(event.event ?? ''))
											.find((e) => e.email === (person?.email ?? ''))}
										class="flex flex-row items-center"
										animate:flip={{
											duration: 200,
										}}
									>
										<HoverCard.Root>
											<HoverCard.Trigger>{person.name}</HoverCard.Trigger>
											<HoverCard.Content>
												<UserCard user={person} />
											</HoverCard.Content>
										</HoverCard.Root>
										<Button
											on:click={async () => {
												team.members.push({
													name: person.name,
													email: person.email,
												});
												team.lastUpdatedBy = $user?.email ?? '';
												team.lastUpdatedTime = new Timestamp(
													Date.now() / 1000,
													0,
												);

												await setDoc(
													doc(db, 'events', event.event ?? ''),
													{
														teams: event.teams,
														lastUpdatedBy: $user?.email ?? '',
													},
													{
														merge: true,
													},
												);
												confetti();
												yay.play();
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
										No one else singed up for this event. Teams should probably
										be merged.
									</li>
								{/each}
							</ul>
						</Dialog.Description>
					</Dialog.Content>
				</Dialog.Root>

				{#if event.event === '*Cardboard Boat'}
					<CardboardBoatDialog teamId={team.id} {event} />
				{:else if event.event !== '*Rooming'}
					<Dialog.Root>
						<Dialog.Trigger>
							<Button>Team Captain</Button>
						</Dialog.Trigger>
						<Dialog.Content>
							<Dialog.Title>Manage team captain</Dialog.Title>
							<Button
								on:click={async () => {
									team.teamCaptain = '';
									team.lastUpdatedBy = $user?.email ?? '';
									team.lastUpdatedTime = new Timestamp(Date.now() / 1000, 0);
									await setDoc(
										doc(db, 'events', event.event ?? ''),
										{
											teams: event.teams,
											lastUpdatedBy: $user?.email ?? '',
										},
										{
											merge: true,
										},
									);
								}}
							>
								Clear
							</Button>
							<ul>
								{#each team.members as teamMember (teamMember.email)}
									<li>
										<HoverCard.Root>
											<HoverCard.Trigger>
												<button
													onclick={async () => {
														team.teamCaptain = teamMember?.email ?? '';
														team.lastUpdatedBy = $user?.email ?? '';
														team.lastUpdatedTime = new Timestamp(
															Date.now() / 1000,
															0,
														);
														await setDoc(
															doc(db, 'events', event.event ?? ''),
															{
																teams: event.teams,
																lastUpdatedBy: $user?.email ?? '',
															},
															{
																merge: true,
															},
														);
													}}
												>
													{teamMember.name}
												</button>
											</HoverCard.Trigger>
											<HoverCard.Content>
												<UserCard
													user={$allUsersCollection.find(
														(u) => u.email === teamMember.email,
													) ?? { email: '', events: [], name: '' }}
												/>
											</HoverCard.Content>
										</HoverCard.Root>
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
			<div class="flex flex-row items-center gap-1">
				<Button
					size="icon"
					href="mailto:{team.members.map((p) => p.email).join(';')}"
				>
					<Mail />
				</Button>
			</div>
			<div>
				<Label class="flex flex-row items-center gap-2">
					<Switch
						onCheckedChange={async (checked) => {
							team.locked = checked;
							team.lastUpdatedBy = $user?.email ?? '';
							team.lastUpdatedTime = new Timestamp(Date.now() / 1000, 0);
							await setDoc(
								doc(db, 'events', event.event ?? ''),
								{
									teams: event.teams,
									lastUpdatedBy: $user?.email ?? '',
								},
								{
									merge: true,
								},
							);
						}}
						checked={team.locked ?? false}
					/>
					Lock team
				</Label>
			</div>
			{#if event.event !== '*Rooming'}
				<div>
					<Dialog.Root closeOnOutsideClick={false}>
						{#key dummyVariableToRerender}
							<StorageList ref="submissions/{event.event}/{team.id}" let:list>
								<Dialog.Trigger>
									<Button>
										Manage Submissions {list?.items.length
											? `(${list.items.length})`
											: ''}
									</Button>
								</Dialog.Trigger>
								<Dialog.Content>
									<Dialog.Title>Manage Submissions</Dialog.Title>
									<Dialog.Description>
										{#if event.submissionDescription}
											<div class="prose dark:prose-invert dark:text-white">
												<!-- eslint-disable-next-line svelte/no-at-html-tags -->
												{@html md.render(
													`## What needs to be submitted:\n\n${event.submissionDescription}`,
												)}
											</div>
										{/if}
										<ul>
											{#each [...(list?.items ?? []), ...filesToUpload] as submission (submission instanceof File ? submission.webkitRelativePath : submission.fullPath)}
												<li class="flex w-full flex-col items-center">
													{#if submission instanceof File}
														<UploadTask
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
																<StorageMetadata ref={submission} let:meta>
																	<SimpleTooltip
																		message={new Date(
																			meta.timeCreated,
																		).toLocaleString()}
																	>
																		<a href={link} target="_blank">
																			{submission.name}
																		</a>
																	</SimpleTooltip>
																</StorageMetadata>
															</DownloadURL>
															<div class="flex flex-grow" />
															<Button
																variant="ghost"
																size="icon"
																on:click={async () => {
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
										</ul>
										<Button
											class="mt-4"
											on:click={() => submissionsFileUpload?.click()}
										>
											Upload
										</Button>
										<input
											bind:this={submissionsFileUpload}
											onchange={(e) => {
												if (e.target instanceof HTMLInputElement) {
													if (!e.target.files?.length) return;
													const files = [...e.target.files];
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
											video files, pdfs, and Word docs (.doc, .docx).
										</p>
										<p>250MB max file size.</p>
										<p>
											If you need to submit a file type not listed, please
											contact Harry (<a href="mailto:s-hallen@lwsd.org"
												>s-hallen@lwsd.org</a
											>).
										</p>
									</Dialog.Description>
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
				<Collapsible.Trigger asChild let:builder>
					<Button
						builders={[builder]}
						variant="ghost"
						size="sm"
						class="flex w-full items-center p-2"
					>
						Manage Requests {#if team.requests?.length}
							({team.requests.length})
						{/if}
						<div class="flex-1" />
						<ChevronsUpDown />
					</Button>
				</Collapsible.Trigger>
				<Collapsible.Content class="px-2">
					<ul>
						{#each team.requests ?? [] as request}
							<li class="flex flex-row">
								<HoverCard.Root>
									<HoverCard.Trigger>{request.name}</HoverCard.Trigger>
									<HoverCard.Content>
										<UserCard
											user={$allUsersCollection.find(
												(u) => u.email === request.email,
											) ?? { email: '', events: [], name: '' }}
										/>
									</HoverCard.Content>
								</HoverCard.Root>
								<Button
									on:click={async () => {
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
										await setDoc(
											doc(db, 'events', event.event ?? ''),
											{
												teams: event.teams,
												lastUpdatedBy: $user?.email ?? '',
											},
											{
												merge: true,
											},
										);
										confetti();
										yay.play();
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
									on:click={async () => {
										team.requests = team.requests?.filter(
											(r) =>
												r.email !== request.email && r.name !== request.name,
										);
										team.lastUpdatedBy = $user?.email ?? '';
										team.lastUpdatedTime = new Timestamp(Date.now() / 1000, 0);
										await setDoc(
											doc(db, 'events', event.event ?? ''),
											{
												teams: event.teams,
												lastUpdatedBy: $user?.email ?? '',
											},
											{
												merge: true,
											},
										);
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
								<Button size="icon">
									<Plus />
								</Button>
							</Dialog.Trigger>
							<Dialog.Content class="max-h-full overflow-y-scroll">
								<Dialog.Title>Create Request</Dialog.Title>

								<Dialog.Description>
									<ul>
										{#each $allUsersCollection.filter((u) => !team.members
													.map((m) => m.email)
													.includes(u.email) && !team.requests
													?.map((r) => r.email)
													.includes(u.email)) as person (person.email)}
											<li
												class:text-green-500={$allUsersCollection
													.filter((m) => m.events.includes(event.event ?? ''))
													.find((e) => e.email === (person?.email ?? ''))}
												class="flex flex-row items-center"
												animate:flip={{
													duration: 200,
												}}
											>
												<HoverCard.Root>
													<HoverCard.Trigger>
														{person.name}
													</HoverCard.Trigger>
													<HoverCard.Content>
														<UserCard user={person} />
													</HoverCard.Content>
												</HoverCard.Root>
												<Button
													on:click={async () => {
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
														await setDoc(
															doc(db, 'events', event.event ?? ''),
															{
																teams: event.teams,
																lastUpdatedBy: $user?.email ?? '',
															},
															{
																merge: true,
															},
														);

														confetti();
														yay.play();
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
								</Dialog.Description>
							</Dialog.Content>
						</Dialog.Root>
					</ul>
				</Collapsible.Content>
			</Collapsible.Root>
			<Collapsible.Root>
				{@const hash = `files-${team.id}`}
				<Collapsible.Trigger asChild let:builder>
					<Button
						builders={[builder]}
						variant="ghost"
						size="sm"
						class="flex w-full items-center p-2"
					>
						Manage Files
						<div class="flex-1" />
						<ChevronsUpDown />
					</Button>
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
														<StorageMetadata ref={file} let:meta>
															<SimpleTooltip
																message={new Date(
																	meta.timeCreated,
																).toLocaleString()}
															>
																<a href={link} target="_blank">
																	{file.name}
																</a>
															</SimpleTooltip>
														</StorageMetadata>
													</DownloadURL>
													<div class="flex flex-grow" />
													<Button
														variant="ghost"
														size="icon"
														on:click={async () => {
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
									on:click={() => {
										const el = document.querySelector(`#${hash}`);
										el instanceof HTMLInputElement && el.click();
									}}
								>
									Upload
								</Button>
								<input
									id={hash}
									onchange={(e) => {
										if (e.target instanceof HTMLInputElement) {
											if (!e.target.files?.length) return;
											const files = [...e.target.files];
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
					class:text-green-500={$allUsersCollection
						.filter((m) => m.events.includes(event.event ?? ''))
						.find(
							(e) => e.email?.toLowerCase() === teamMember.email.toLowerCase(),
						)}
					class="flex flex-row items-center gap-2"
					animate:flip={{
						duration: 200,
					}}
				>
					<HoverCard.Root>
						<HoverCard.Trigger
							href="/events/{encodeURIComponent(teamMember.email)}"
						>
							{teamMember.name}
						</HoverCard.Trigger>
						<HoverCard.Content>
							<UserCard
								user={$allUsersCollection.find(
									(u) => u.email === teamMember.email,
								) ?? { email: '', events: [], name: '' }}
							/>
						</HoverCard.Content>
					</HoverCard.Root>

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
						on:click={async () => {
							team.members.splice(
								team.members.findIndex(
									(e) =>
										e.email === (teamMember?.email ?? '') &&
										e.name === (teamMember?.name ?? ''),
								),
								1,
							);
							team.lastUpdatedBy = $user?.email ?? '';
							await setDoc(
								doc(db, 'events', event.event ?? ''),
								{
									teams: event.teams,
									lastUpdatedBy: $user?.email ?? '',
								},
								{
									merge: true,
								},
							);
							aww.play();
						}}
					>
						<Minus />
					</Button>
				</li>
			{/each}
		</ul>
	</Card.Content>
</Card.Root>
