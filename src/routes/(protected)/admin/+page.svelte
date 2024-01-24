<script lang="ts">
	import { page } from '$app/stores';
	import {
		SimpleTooltip,
		StorageMetadata,
		allUsersCollection,
		auth,
		aww,
		db,
		fancyConfirm,
		md,
		sendEmail,
		settings,
		yay,
		type EventDoc,
		type UserDoc,
	} from '$lib';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Collapsable from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Progress } from '$lib/components/ui/progress';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import confetti from 'canvas-confetti';
	import { Timestamp, deleteDoc, doc, setDoc } from 'firebase/firestore';
	import { deleteObject } from 'firebase/storage';
	import Fuse from 'fuse.js';
	import {
		ChevronsUpDown,
		Crown,
		Mail,
		Minus,
		Plus,
		Trash2,
		UserPlus,
		X,
	} from 'lucide-svelte';
	import { flip } from 'svelte/animate';
	import { writable } from 'svelte/store';
	import {
		DownloadURL,
		StorageList,
		UploadTask,
		collectionStore,
		userStore,
	} from 'sveltefire';
	import UserCard from './UserCard.svelte';

	const user = userStore(auth);

	let search = decodeURIComponent($page.url.searchParams.get('q') ?? '');

	const usersDoc = collectionStore<UserDoc>(db, 'users');
	const events = collectionStore<EventDoc>(db, 'events');

	$: eventData = $events.length
		? $events
				.map((e) => ({
					...e,
					members: (
						$usersDoc?.filter((m) => m.events.includes(e.event)) ?? []
					).map((m) => ({
						name: m.name,
						email: m.email,
					})),
				}))
				.sort((a, b) => a.event.localeCompare(b.event))
		: [];

	let shouldHideIndividualEvents = false;
	let onlyShowOverflown = false;

	const fuseKeys = { event: true, members: true };
	let threshold = 0.2;
	$: fuse = new Fuse(
		eventData.map((e) => ({ ...e, members: e.members.map((m) => m.name) })),
		{
			keys: Object.entries(fuseKeys)
				.filter(([, value]) => value)
				.map(([key]) => key),
			threshold,
		},
	);
	$: signedUpEvents = eventData;
	$: eventResults =
		search === ''
			? eventData.map((r) => r.event)
			: fuse.search(search).map((r) => r.item.event);

	const reallyStupidFunction = (arr: unknown[]) =>
		arr as {
			name: string;
			email: string;
		}[];

	const intersect = <T,>(a: T[], b: T[]): T[] => {
		const setB = new Set(b);
		return [...new Set(a)].filter((x) => setB.has(x));
	};
	const nonOverlappingEvents = (event: (typeof eventData)[0]) =>
		eventData.filter(
			(e) =>
				intersect(
					e.members.map((m) => m.name),
					event.members.map((m) => m.name),
				).length === 0,
		);

	const newEventStuff = {
		event: '',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 1,
		locked: false,
	};

	let newEventDialogOpen = false;

	let submissionsFileUpload: HTMLInputElement;
	const filesToUpload = writable<File[]>([]);

	let dummyVariableToRerender = 0;
	const updateStorageList = () => {
		dummyVariableToRerender++;
		return '';
	};
	const filterSubmissions = (submission: File) => {
		$filesToUpload = $filesToUpload.filter((f) => f !== submission);
		return '';
	};

	const submissionDescriptionElementMap: Record<string, Textarea> = {};

	const openTeamNumberDialogs: Record<string, boolean> = {};
</script>

<svelte:window
	on:keydown={(e) => {
		const el = document.querySelector('#search');
		if (
			e.key === '/' &&
			el !== document.activeElement &&
			!(document.activeElement instanceof HTMLInputElement) &&
			!(document.activeElement instanceof HTMLTextAreaElement)
		) {
			if (el instanceof HTMLInputElement) {
				el.focus();
				e.preventDefault();
			}
		}
	}}
/>

<div class="container mt-8 flex flex-col items-center">
	<h1 class="my-4 mb-6 text-3xl font-bold">
		Please don't add yourself to events that you aren't in!
	</h1>
	<div class="mb-4 flex w-full flex-col gap-4 md:flex-row">
		<Label class="flex flex-row items-center">
			<Switch class="mr-2" bind:checked={fuseKeys.event} />
			Search by events
		</Label>
		<Label class="flex flex-row items-center">
			<Switch class="mr-2" bind:checked={fuseKeys.members} />
			Search by members
		</Label>
		<Label class="flex flex-row items-center">
			<Switch class="mr-2" bind:checked={shouldHideIndividualEvents} />
			Hide individual events
		</Label>
		<Label class="flex flex-row items-center">
			<Switch class="mr-2" bind:checked={onlyShowOverflown} />
			Only show overflown events
		</Label>
	</div>
	<Input
		class="mb-4"
		bind:value={search}
		type="search"
		id="search"
		placeholder="Search"
	/>

	<p class="mb-2 w-full">Green team: full; red team: over or underfilled</p>
	<div class="mb-4 w-full space-y-2">
		<Dialog.Root bind:open={newEventDialogOpen}>
			<Dialog.Trigger class={buttonVariants()}>Create new event</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Title>Create new event</Dialog.Title>
				<Dialog.Description>
					<form
						class="flex flex-col gap-4"
						on:submit|preventDefault={async () => {
							await setDoc(doc(db, 'events', newEventStuff.event), {
								...newEventStuff,
								teams: [],
								lastUpdatedBy: $user?.email ?? '',
							});
							newEventDialogOpen = false;
						}}
					>
						<Label class="flex w-full max-w-sm flex-col gap-1.5">
							<span>Event name</span>
							<Input
								bind:value={newEventStuff.event}
								placeholder="really cool event name"
							/>
						</Label>
						<Label class="flex w-full max-w-sm flex-col gap-1.5">
							<span>Minimum team size</span>
							<Input
								bind:value={newEventStuff.minTeamSize}
								type="number"
								placeholder="1"
							/>
						</Label>
						<Label class="flex w-full max-w-sm flex-col gap-1.5">
							<span>Maximum team size</span>
							<Input
								bind:value={newEventStuff.maxTeamSize}
								type="number"
								placeholder="1"
							/>
						</Label>
						<Label class="flex w-full max-w-sm flex-col gap-1.5">
							<span>Maximum teams per chapter</span>
							<Input
								bind:value={newEventStuff.perChapter}
								type="number"
								placeholder="1"
							/>
						</Label>
						<div class="flex items-center space-x-2">
							<Checkbox
								id="newEventLocked"
								bind:checked={newEventStuff.locked}
							/>
							<Label for="newEventLocked" class="text-foreground">Lock</Label>
						</div>
						<div>
							<Button type="submit">Create</Button>
						</div>
					</form>
				</Dialog.Description>
			</Dialog.Content>
		</Dialog.Root>
		<div class="flex items-center space-x-2">
			<Button
				on:click={() => {
					for (const event of signedUpEvents) {
						setDoc(
							doc(db, 'events', event.event ?? ''),
							{
								teamCreationLocked: true,
								lastUpdatedBy: $user?.email ?? '',
							},
							{
								merge: true,
							},
						);
					}
				}}
			>
				Disable all team creation
			</Button>
		</div>
		<div class="flex items-center space-x-2">
			<Switch
				id="enable-online-submissions"
				checked={$settings?.enableOnlineSubmissions ?? false}
				onCheckedChange={async (e) => {
					await setDoc(
						doc(db, 'settings', 'settings'),
						{
							enableOnlineSubmissions: e,
							lastUpdatedBy: $user?.email ?? '',
						},
						{ merge: true },
					);
				}}
			/>
			<Label for="enable-online-submissions">Enable online submissions</Label>
		</div>
		<div class="flex items-center space-x-2">
			<Switch
				id="enable-rooming"
				checked={$settings?.enableRooming ?? false}
				onCheckedChange={async (e) => {
					await setDoc(
						doc(db, 'settings', 'settings'),
						{
							enableRooming: e,
							lastUpdatedBy: $user?.email ?? '',
						},
						{ merge: true },
					);
				}}
			/>
			<Label for="enable-rooming">Show rooming</Label>
		</div>
	</div>
	<div
		class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:items-start xl:grid-cols-3"
	>
		{#each signedUpEvents ?? [] as event (event.event)}
			{#if !shouldHideIndividualEvents || (shouldHideIndividualEvents && event.maxTeamSize > 1)}
				<Card.Root
					class="{eventResults.includes(event.event)
						? ''
						: 'hidden'} {onlyShowOverflown &&
					event.teams.length <= event.perChapter
						? 'hidden'
						: ''}"
				>
					<Card.Header>
						<Card.Title class="flex flex-row items-center">
							<span>{event.event}</span>
							<div class="flex-grow"></div>
							<Button
								variant="destructive"
								size="icon"
								on:click={async () => {
									if (
										!(await fancyConfirm(
											'Are you sure?',
											'Are you sure you want to delete this event?',
										))
									)
										return;
									if (
										!(await fancyConfirm(
											'Are you really sure?',
											" This will delete ALL TEAMS and remove this event from everyone's sign up form.",
										))
									)
										return;
									if (
										!prompt('Type "delete this event" to await fancyConfirm.')
											?.toLowerCase()
											.includes('delete this event')
									)
										return;

									await deleteDoc(doc(db, 'events', event.event ?? ''));
								}}
							>
								<Trash2 />
							</Button>
						</Card.Title>
						<Card.Description>
							<ul class="mb-2">
								<li>
									Min {event.minTeamSize} people per team
								</li>
								<li>
									Max {event.maxTeamSize} people per team
								</li>
								<li class:text-red-500={event.teams.length > event.perChapter}>
									Max {event.perChapter} teams per chapter (currently {event
										.teams.length})
								</li>
								<li>
									{event.teams.reduce(
										(acc, curr) => acc + curr.members.length,
										0,
									)}/{event.event === '*Rooming'
										? $allUsersCollection.filter((u) => u.events.length > 0)
												.length
										: eventData.find((e) => e.event === event.event)?.members
												.length ?? 0} people joined {event.event === '*Rooming'
										? 'rooms'
										: 'teams'}
								</li>
								<li>
									ID: {event.id}
								</li>
							</ul>
							{#if event.event !== '*Rooming'}
								<div class="flex flex-col gap-2">
									<p class="text-black dark:text-white">
										Submission description:
									</p>
									<p class="prose dark:prose-invert">
										<!-- eslint-disable-next-line svelte/no-at-html-tags -->
										{@html md.render(event.submissionDescription ?? '(none)')}
									</p>
									<Dialog.Root>
										<Dialog.Trigger>
											<Button>Edit</Button>
										</Dialog.Trigger>
										<Dialog.Content>
											<Dialog.Title>Edit submission description</Dialog.Title>
											<p>Markdown is allowed</p>
											<Textarea
												placeholder="Submission description"
												class="w-full"
												value={event.submissionDescription}
												bind:this={submissionDescriptionElementMap[event.event]}
											/>
											<Dialog.Footer>
												<Button
													on:click={() => {
														setDoc(
															doc(db, 'events', event.event),
															{
																submissionDescription:
																	submissionDescriptionElementMap[event.event]
																		?.value ?? '',
																lastUpdatedBy: $user?.email ?? '',
															},
															{
																merge: true,
															},
														);

														const el = document.querySelector(
															'[data-melt-dialog-close]',
														);
														if (el instanceof HTMLButtonElement) el.click();
													}}
												>
													Save
												</Button>
											</Dialog.Footer>
										</Dialog.Content>
									</Dialog.Root>
								</div>
							{/if}
							{@const peopleInTeams = event.teams.reduce(
								(acc, curr) => [...acc, ...curr.members],
								reallyStupidFunction([]),
							)}
							{@const peopleNotInTeams =
								event.event === '*Rooming'
									? $usersDoc.filter(
											(m) =>
												m.events.length &&
												!peopleInTeams.find(
													(e) =>
														e.email?.toLowerCase() === m.email?.toLowerCase(),
												),
										)
									: $usersDoc.filter(
											(m) =>
												m.events.includes(event.event ?? '') &&
												!peopleInTeams.find(
													(e) =>
														e.email?.toLowerCase() === m.email?.toLowerCase(),
												),
										)}
							{#if peopleNotInTeams.length}
								<Collapsable.Root>
									<Collapsable.Trigger asChild let:builder>
										<Button
											builders={[builder]}
											variant="ghost"
											size="sm"
											class="flex w-full items-center p-2"
										>
											People not in {event.event === '*Rooming'
												? 'rooms'
												: 'teams'}
											<div class="flex-1" />
											<ChevronsUpDown />
										</Button>
									</Collapsable.Trigger>
									<Collapsable.Content>
										<Button
											href="mailto:?cc={$usersDoc
												.filter((u) => u.admin)
												.map((u) => u.email)
												.join(';')}&bcc={peopleNotInTeams
												.map((p) => p.email)
												.join(';')}&subject={event.event}"
										>
											Email everyone
										</Button>
										{#if event.event !== '*Rooming'}
											<Button
												variant="destructive"
												size="icon"
												on:click={async () => {
													if (
														await fancyConfirm(
															'Are you sure',
															"Are you sure you want to remove everyone who hasn't created a team yet from this event?",
														)
													) {
														peopleNotInTeams.forEach(async (person) => {
															const userDoc = $usersDoc.find(
																(u) =>
																	u.email?.toLowerCase() ===
																	person.email?.toLowerCase(),
															);
															if (userDoc) {
																userDoc.events = userDoc.events.filter(
																	(e) => e !== event.event,
																);
																await setDoc(
																	doc(
																		db,
																		'users',
																		userDoc.email?.toLowerCase() ?? '',
																	),
																	{
																		...userDoc,
																		lastUpdatedBy: $user?.email ?? '',
																	},
																	{ merge: true },
																);
															}
														});
													}
												}}
											>
												<Trash2 />
											</Button>
										{/if}
										<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
											{#each peopleNotInTeams as person (person.email)}
												<li>
													<HoverCard.Root>
														<HoverCard.Trigger
															href="/events/{encodeURIComponent(
																person.email.toLowerCase(),
															)}"
															class="underline"
														>
															{person.name}
														</HoverCard.Trigger>
														<HoverCard.Content>
															<UserCard user={person} />
														</HoverCard.Content>
													</HoverCard.Root>
												</li>
											{/each}
										</ul>
									</Collapsable.Content>
								</Collapsable.Root>
							{/if}
							{#if event.event !== '*Rooming'}
								<Collapsable.Root>
									<Collapsable.Trigger asChild let:builder>
										<Button
											builders={[builder]}
											variant="ghost"
											size="sm"
											class="flex w-full items-center p-2"
										>
											Events without member overlap
											<div class="flex-1" />
											<ChevronsUpDown />
										</Button>
									</Collapsable.Trigger>
									<Collapsable.Content>
										<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
											{#each nonOverlappingEvents(event) as e (e.event)}
												<li>
													<!-- svelte-ignore a11y-invalid-attribute -->
													<a
														href="#"
														class="underline"
														on:click={() => (search = e.event)}
													>
														{e.event}
													</a>
												</li>
											{/each}
										</ul>
									</Collapsable.Content>
								</Collapsable.Root>
								<Collapsable.Root>
									<Collapsable.Trigger asChild let:builder>
										<Button
											builders={[builder]}
											variant="ghost"
											size="sm"
											class="flex w-full items-center p-2"
										>
											Everyone in event
											<div class="flex-1" />
											<ChevronsUpDown />
										</Button>
									</Collapsable.Trigger>
									<Collapsable.Content>
										<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
											{#each event.members as person (person.email)}
												<li>
													<HoverCard.Root>
														<HoverCard.Trigger
															href="/events/{encodeURIComponent(
																person.email.toLowerCase(),
															)}"
															class="underline"
														>
															{person.name}
														</HoverCard.Trigger>
														<HoverCard.Content>
															<UserCard
																user={$allUsersCollection.find(
																	(u) => u.email === person.email,
																) ?? { email: '', events: [], name: '' }}
															/>
														</HoverCard.Content>
													</HoverCard.Root>
												</li>
											{/each}
										</ul>
									</Collapsable.Content>
								</Collapsable.Root>
							{/if}
						</Card.Description>
					</Card.Header>
					<Card.Content class="flex flex-col gap-4">
						<Label class="flex flex-row items-center gap-2">
							<Switch
								onCheckedChange={async (checked) => {
									event.locked = checked;
									await setDoc(
										doc(db, 'events', event.event ?? ''),
										{
											locked: checked,
											lastUpdatedBy: $user?.email ?? '',
										},
										{
											merge: true,
										},
									);
								}}
								checked={event.locked ?? false}
							/>
							Lock {event.event === '*Rooming' ? 'rooming' : 'event'}
						</Label>
						{#if event.event !== '*Rooming'}
							<div class="flex items-center space-x-2">
								<Switch
									id="lock-team-creation"
									bind:checked={event.teamCreationLocked}
									onCheckedChange={async (e) => {
										await setDoc(
											doc(db, 'events', event.event),
											{
												teamCreationLocked: e,
												lastUpdatedBy: $user?.email ?? '',
											},
											{ merge: true },
										);
									}}
								/>
								<Label for="lock-team-creation">
									Lock team creation when full
								</Label>
							</div>
							<Label class="flex flex-row items-center gap-2">
								<Switch
									onCheckedChange={async (checked) => {
										event.onlineSubmissions = checked;
										await setDoc(
											doc(db, 'events', event.event ?? ''),
											{
												onlineSubmissions: checked,
												lastUpdatedBy: $user?.email ?? '',
											},
											{
												merge: true,
											},
										);
									}}
									checked={event.onlineSubmissions ?? false}
								/>
								Online submissions
							</Label>
						{/if}

						{#each event.teams as team (team.id)}
							<Card.Root
								class="{team.members.length > event.maxTeamSize ||
								team.members.length < event.minTeamSize
									? 'bg-red-300 dark:bg-red-950'
									: team.members.length === event.maxTeamSize
										? 'bg-green-300 dark:bg-green-950'
										: 'bg-blue-100 dark:bg-slate-900'} bg-opacity-20"
							>
								<Card.Header>
									<Card.Title>
										{#if event.event === '*Rooming'}
											Room #{team.teamNumber}
										{:else}
											Team 2082-{team.teamNumber}
										{/if}
										<Dialog.Root bind:open={openTeamNumberDialogs[team.id]}>
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
																						teamNumber: el.value,
																					}
																				: t,
																		),
																		lastUpdatedBy: $user?.email ?? '',
																	},
																	{
																		merge: true,
																	},
																);
																openTeamNumberDialogs[team.id] = false;
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
													<Button
														size="icon"
														class="bg-green-500 hover:bg-green-400"
													>
														<UserPlus />
													</Button>
												</Dialog.Trigger>
												<Dialog.Content class="max-h-full overflow-y-scroll">
													<Dialog.Title>Add People</Dialog.Title>
													<Dialog.Description>
														<p>All people not already in a team:</p>
														<ul>
															{#each $usersDoc
																.filter((p) => !event.teams.find( (t) => t.members?.find((e) => e.email.toLowerCase() === p.email?.toLowerCase()), ))
																.sort( (a, b) => a?.name?.localeCompare(b?.name), ) as person (person.email)}
																<li
																	class:text-green-500={$usersDoc
																		.filter((m) =>
																			m.events.includes(event.event ?? ''),
																		)
																		.find(
																			(e) => e.email === (person?.email ?? ''),
																		)}
																	class="flex flex-row items-center"
																	animate:flip={{
																		duration: 200,
																	}}
																>
																	<HoverCard.Root>
																		<HoverCard.Trigger
																			>{person.name}</HoverCard.Trigger
																		>
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
																	No one else singed up for this event. Teams
																	should probably be merged.
																</li>
															{/each}
														</ul>
													</Dialog.Description>
												</Dialog.Content>
											</Dialog.Root>

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
														Clear
													</Button>
													<ul>
														{#each team.members as teamMember (teamMember.email)}
															<!-- svelte-ignore a11y-click-events-have-key-events -->
															<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
															<li
																class="cursor-pointer"
																on:click={async () => {
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
																<HoverCard.Root>
																	<HoverCard.Trigger
																		>{teamMember.name}</HoverCard.Trigger
																	>
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
																		<Tooltip.Content>
																			Team captain
																		</Tooltip.Content>
																	</Tooltip.Root>
																{/if}
															</li>
														{/each}
													</ul>
												</Dialog.Content>
											</Dialog.Root>
										</div>
										<div class="flex flex-row items-center gap-1">
											<Button
												size="icon"
												href="mailto:?cc={$usersDoc
													.filter((u) => u.admin)
													.map((u) => u.email)
													.join(';')}&bcc={team.members
													.map((p) => p.email)
													.join(';')}&subject={event.event}"
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
													checked={team.locked ?? false}
												/>
												Lock team
											</Label>
										</div>
										{#if event.event !== '*Rooming'}
											<div>
												<Dialog.Root closeOnOutsideClick={false}>
													{#key dummyVariableToRerender}
														<StorageList
															ref="submissions/{event.event}/{team.id}"
															let:list
														>
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
																		<div
																			class="prose dark:prose-invert dark:text-white"
																		>
																			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
																			{@html md.render(
																				`## What needs to be submitted:\n\n${event.submissionDescription}`,
																			)}
																		</div>
																	{/if}
																	<ul>
																		{#each [...(list?.items ?? []), ...$filesToUpload] as submission (submission instanceof File ? submission.webkitRelativePath : submission.fullPath)}
																			<li
																				class="flex w-full flex-col items-center"
																			>
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
																							<Progress
																								value={progress}
																								class="w-full"
																							/>

																							<span class="w-full">
																								{submission.name}
																							</span>
																						{/if}
																					</UploadTask>
																				{:else}
																					<div
																						class="flex w-full flex-row items-center"
																					>
																						<DownloadURL
																							ref={submission}
																							let:link
																						>
																							<StorageMetadata
																								ref={submission}
																								let:meta
																							>
																								<SimpleTooltip
																									message={new Date(
																										meta.timeCreated,
																									).toLocaleString()}
																								>
																									<a
																										href={link}
																										target="_blank"
																									>
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
																								if (submission instanceof File)
																									return;
																								await deleteObject(submission);
																								team.lastUpdatedBy =
																									$user?.email ?? '';
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
																		on:click={() =>
																			submissionsFileUpload.click()}
																	>
																		Upload
																	</Button>
																	<input
																		bind:this={submissionsFileUpload}
																		on:change={(e) => {
																			if (
																				e.target instanceof HTMLInputElement
																			) {
																				if (!e.target.files?.length) return;
																				const files = [...e.target.files];
																				for (const file of files) {
																					if (
																						list?.items
																							.map((f) => f.name)
																							.includes(file.name)
																					) {
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

																	<p>
																		Allowed file types: all image files, all
																		audio files, all video files, pdfs, and Word
																		docs (.doc, .docx).
																	</p>
																	<p>250MB max file size.</p>
																	<p>
																		If you need to submit a file type not
																		listed, please contact Harry (<a
																			href="mailto:s-hallen@lwsd.org"
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
										<Collapsable.Root>
											<Collapsable.Trigger asChild let:builder>
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
											</Collapsable.Trigger>
											<Collapsable.Content class="px-2">
												<ul>
													{#each team.requests ?? [] as request}
														<li class="flex flex-row">
															<HoverCard.Root>
																<HoverCard.Trigger
																	>{request.name}</HoverCard.Trigger
																>
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
																	team.lastUpdatedTime = new Timestamp(
																		Date.now() / 1000,
																		0,
																	);
																	team.requests = team.requests?.filter(
																		(r) =>
																			r.email !== request.email &&
																			r.name !== request.name,
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
																			r.email !== request.email &&
																			r.name !== request.name,
																	);
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
														<Dialog.Content
															class="max-h-full overflow-y-scroll"
														>
															<Dialog.Title>Create Request</Dialog.Title>

															<Dialog.Description>
																<ul>
																	{#each $usersDoc.filter((u) => !team.members
																				.map((m) => m.email)
																				.includes(u.email) && !team.requests
																				?.map((r) => r.email)
																				.includes(u.email)) as person (person.email)}
																		<li
																			class:text-green-500={$usersDoc
																				.filter((m) =>
																					m.events.includes(event.event ?? ''),
																				)
																				.find(
																					(e) =>
																						e.email === (person?.email ?? ''),
																				)}
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
																					team.lastUpdatedBy =
																						$user?.email ?? '';
																					team.lastUpdatedTime = new Timestamp(
																						Date.now() / 1000,
																						0,
																					);
																					await setDoc(
																						doc(
																							db,
																							'events',
																							event.event ?? '',
																						),
																						{
																							teams: event.teams,
																							lastUpdatedBy: $user?.email ?? '',
																						},
																						{
																							merge: true,
																						},
																					);
																					sendEmail(
																						team.members.map((m) => m.email),
																						'New team request',
																						`${
																							person.name ?? 'Someone'
																						} has requested to join your team for ${
																							event.event
																						}. Please go to the <a href="https://tsa-grouping-thing.vercel.app">team creation wizard</a> to accept or deny the request.<br /><br />- JHS TSA Board<br />Please do not reply to this email; it comes from an unmonitored email address.`,
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
											</Collapsable.Content>
										</Collapsable.Root>
										<Collapsable.Root>
											{@const hash = `files-${team.id}`}
											<Collapsable.Trigger asChild let:builder>
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
											</Collapsable.Trigger>
											<Collapsable.Content class="px-2">
												{#key dummyVariableToRerender}
													<StorageList
														ref="files/{event.event}/{team.id}"
														let:list
													>
														{#if list === null}
															<p>Loading...</p>
														{:else}
															<ul>
																{#each [...(list?.items ?? []), ...($filesToUpload[0] ? [$filesToUpload[0]] : [])] as file}
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
																					<Progress
																						value={progress}
																						class="w-full"
																					/>

																					<span class="w-full">
																						{file.name}
																					</span>
																				{/if}
																			</UploadTask>
																		{:else}
																			<div
																				class="flex w-full flex-row items-center"
																			>
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
																						team.lastUpdatedBy =
																							$user?.email ?? '';
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
																on:change={(e) => {
																	if (e.target instanceof HTMLInputElement) {
																		if (!e.target.files?.length) return;
																		const files = [...e.target.files];
																		for (const file of files) {
																			if (
																				list?.items
																					.map((f) => f.name)
																					.includes(file.name)
																			) {
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
														{/if}
													</StorageList>
												{/key}
											</Collapsable.Content>
										</Collapsable.Root>
									</div>
									<ul>
										{#each team.members as teamMember (teamMember.email)}
											<li
												class:text-green-500={$usersDoc
													.filter((m) => m.events.includes(event.event ?? ''))
													.find(
														(e) =>
															e.email?.toLowerCase() ===
															teamMember.email.toLowerCase(),
													)}
												class="flex flex-row items-center gap-2"
												animate:flip={{
													duration: 200,
												}}
											>
												<HoverCard.Root>
													<HoverCard.Trigger
														href="/events/{encodeURIComponent(
															teamMember.email,
														)}">{teamMember.name}</HoverCard.Trigger
													>
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
						{/each}
					</Card.Content>
					<Card.Footer class="space-x-2">
						<Button
							on:click={async () => {
								let lowestNotTaken = 1;
								while (
									event.teams.find((t) => t.teamNumber === lowestNotTaken)
								) {
									lowestNotTaken++;
								}

								event.teams.push({
									members: [],
									lastUpdatedBy: $user?.email ?? '',
									id: crypto.randomUUID(),
									teamNumber: lowestNotTaken,
								});
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
							Create Team
						</Button>
						{#if event.maxTeamSize === 1}
							<Button
								variant="outline"
								on:click={() => {
									for (const member of event.members) {
										if (
											!event.teams.find((t) =>
												t.members.find((m) => m.email === member.email),
											)
										) {
											let lowestNotTaken = 1;
											while (
												event.teams.find((t) => t.teamNumber === lowestNotTaken)
											) {
												lowestNotTaken++;
											}
											event.teams.push({
												members: [member],
												lastUpdatedBy: $user?.email ?? '',
												id: crypto.randomUUID(),
												teamNumber: lowestNotTaken,
											});
										}
									}
									setDoc(
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
								Create team for everyone
							</Button>
						{/if}
					</Card.Footer>
				</Card.Root>
			{/if}
		{:else}
			<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
			{#each { length: 9 } as _}
				<Skeleton class="h-[32rem] w-full" />
			{/each}
		{/each}
	</div>
</div>
