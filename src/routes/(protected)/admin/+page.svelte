<script lang="ts">
	import { page } from '$app/stores';
	import {
		allUsersCollection,
		auth,
		db,
		eventsCollection,
		fancyConfirm,
		md,
		settings,
	} from '$lib';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { deleteDoc, doc, setDoc } from 'firebase/firestore';
	import Fuse from 'fuse.js';
	import { ChevronsUpDown, Download, Trash2 } from 'lucide-svelte';
	import { userStore } from 'sveltefire';
	import Team from './Team.svelte';
	import UserCard from './UserCard.svelte';

	const user = userStore(auth);

	let search = decodeURIComponent($page.url.searchParams.get('q') ?? '');

	$: eventData = $eventsCollection.length
		? $eventsCollection
				.map((e) => ({
					...e,
					members: (
						$allUsersCollection?.filter((m) => m.events.includes(e.event)) ?? []
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
	const submissionDescriptionElementMap: Record<string, Textarea> = {};
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
							<div class="flex-grow" />
							{#if event.event === '*Rooming'}
								<Button
									size="icon"
									class="mr-2"
									on:click={() => {
										let csv = `Room number,member 1,member 2,member 3,member 4\n`;
										for (const team of event.teams) {
											csv += `${team.teamNumber},${team.members
												.map((m) => `"${m.name}"`)
												.join(',')}\n`;
										}
										const blob = new Blob([csv], {
											type: 'text/csv;charset=utf-8;',
										});
										const url = URL.createObjectURL(blob);
										const link = document.createElement('a');
										link.setAttribute('href', url);
										link.setAttribute('download', 'rooming.csv');
										link.style.visibility = 'hidden';
										document.body.appendChild(link);
										link.click();
										document.body.removeChild(link);
										URL.revokeObjectURL(url);
									}}
								>
									<Download />
								</Button>
							{/if}
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
								{#if event.event === '*Rooming'}
									<li>
										{event.teams.length} rooms
									</li>
									<li>
										{event.teams
											.filter((t) => t.members.length < event.minTeamSize)
											.reduce((acc, curr) => (acc += curr.members.length), 0)} people
										in unfilled rooms
									</li>
								{/if}
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
									? $allUsersCollection.filter(
											(m) =>
												m.events.length &&
												!peopleInTeams.find(
													(e) =>
														e.email?.toLowerCase() === m.email?.toLowerCase(),
												),
										)
									: $allUsersCollection.filter(
											(m) =>
												m.events.includes(event.event ?? '') &&
												!peopleInTeams.find(
													(e) =>
														e.email?.toLowerCase() === m.email?.toLowerCase(),
												),
										)}
							{#if peopleNotInTeams.length}
								<Collapsible.Root>
									<Collapsible.Trigger asChild let:builder>
										<Button
											builders={[builder]}
											variant="ghost"
											size="sm"
											class="flex w-full items-center p-2"
										>
											People not in {event.event === '*Rooming'
												? 'rooms'
												: 'teams'} ({peopleNotInTeams.length})
											<div class="flex-1" />
											<ChevronsUpDown />
										</Button>
									</Collapsible.Trigger>
									<Collapsible.Content>
										<Button
											href="mailto:?cc={$allUsersCollection
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
															const userDoc = $allUsersCollection.find(
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
									</Collapsible.Content>
								</Collapsible.Root>
							{/if}
							{#if event.event !== '*Rooming'}
								<Collapsible.Root>
									<Collapsible.Trigger asChild let:builder>
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
									</Collapsible.Trigger>
									<Collapsible.Content>
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
									</Collapsible.Content>
								</Collapsible.Root>
								<Collapsible.Root>
									<Collapsible.Trigger asChild let:builder>
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
									</Collapsible.Trigger>
									<Collapsible.Content>
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
									</Collapsible.Content>
								</Collapsible.Root>
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
						<!-- teams loop -->
						{#each event.teams as team (team.id)}
							<Team {event} {team} />
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
