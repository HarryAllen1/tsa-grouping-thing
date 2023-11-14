<script lang="ts">
	import { page } from '$app/stores';
	import {
		auth,
		aww,
		db,
		sendEmail,
		yay,
		type EventDoc,
		type UserDoc,
		fancyConfirm,
	} from '$lib';
	import { board } from '$lib/board';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Collapsable from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Switch } from '$lib/components/ui/switch';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import confetti from 'canvas-confetti';
	import { Timestamp, deleteDoc, doc, setDoc } from 'firebase/firestore';
	import Fuse from 'fuse.js';
	import {
		ChevronsUpDown,
		Crown,
		Mail,
		Minus,
		Plus,
		Trash2,
		UserPlus,
	} from 'lucide-svelte';
	import { flip } from 'svelte/animate';
	import { collectionStore, userStore } from 'sveltefire';

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
</script>

<svelte:window
	on:keydown={(e) => {
		const el = document.querySelector('#search');
		if (e.key === '/' && el !== document.activeElement) {
			if (el instanceof HTMLInputElement) {
				el.focus();
				e.preventDefault();
			}
		}
	}}
/>

<div class="mt-8 flex flex-col items-center container">
	<h1 class="text-3xl font-bold my-4 mb-6">
		Please don't add yourself to events that you aren't in!
	</h1>
	<div class="w-full mb-4 flex flex-col md:flex-row gap-4">
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
	<div class="w-full mb-4">
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
							});
							newEventDialogOpen = false;
						}}
					>
						<Label class="flex flex-col w-full max-w-sm gap-1.5">
							<span>Event name</span>
							<Input
								bind:value={newEventStuff.event}
								placeholder="really cool event name"
							/>
						</Label>
						<Label class="flex flex-col w-full max-w-sm gap-1.5">
							<span>Minimum team size</span>
							<Input
								bind:value={newEventStuff.minTeamSize}
								type="number"
								placeholder="1"
							/>
						</Label>
						<Label class="flex flex-col w-full max-w-sm gap-1.5">
							<span>Maximum team size</span>
							<Input
								bind:value={newEventStuff.maxTeamSize}
								type="number"
								placeholder="1"
							/>
						</Label>
						<Label class="flex flex-col w-full max-w-sm gap-1.5">
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
	</div>
	<div
		class="grid items-center w-full gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 lg:items-start"
	>
		{#each signedUpEvents ?? [] as event}
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
									)}/{eventData.find((e) => e.event === event.event)?.members
										.length ?? 0} people joined teams
								</li>
							</ul>
							{@const peopleInTeams = event.teams.reduce(
								(acc, curr) => [...acc, ...curr.members],
								reallyStupidFunction([]),
							)}
							{@const peopleNotInTeams = $usersDoc.filter(
								(m) =>
									m.events.includes(event.event ?? '') &&
									!peopleInTeams.find(
										(e) => e.email?.toLowerCase() === m.email?.toLowerCase(),
									),
							)}
							{#if peopleNotInTeams.length}
								<Collapsable.Root>
									<Collapsable.Trigger asChild let:builder>
										<Button
											builders={[builder]}
											variant="ghost"
											size="sm"
											class="p-2 flex items-center w-full"
										>
											People not in teams
											<div class="flex-1" />
											<ChevronsUpDown />
										</Button>
									</Collapsable.Trigger>
									<Collapsable.Content>
										<Button
											href="mailto:?cc={board.join(';')}&bcc={peopleNotInTeams
												.map((p) => p.email)
												.join(';')}&subject={event.event}"
										>
											Email everyone
										</Button>
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
																userDoc,
																{ merge: true },
															);
														}
													});
												}
											}}
										>
											<Trash2 />
										</Button>
										<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
											{#each peopleNotInTeams as person}
												<li>
													<a
														href="/events/{encodeURIComponent(
															person.email.toLowerCase(),
														)}"
														class="underline"
													>
														{person.name}
													</a>
												</li>
											{/each}
										</ul>
									</Collapsable.Content>
								</Collapsable.Root>
							{/if}
							<Collapsable.Root>
								<Collapsable.Trigger asChild let:builder>
									<Button
										builders={[builder]}
										variant="ghost"
										size="sm"
										class="p-2 flex items-center w-full"
									>
										Events without member overlap
										<div class="flex-1" />
										<ChevronsUpDown />
									</Button>
								</Collapsable.Trigger>
								<Collapsable.Content>
									<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
										{#each nonOverlappingEvents(event) as e}
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
										class="p-2 flex items-center w-full"
									>
										Everyone in event
										<div class="flex-1" />
										<ChevronsUpDown />
									</Button>
								</Collapsable.Trigger>
								<Collapsable.Content>
									<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
										{#each event.members as person}
											<li>
												<a
													href="/events/{encodeURIComponent(
														person.email.toLowerCase(),
													)}"
													class="underline"
												>
													{person.name}
												</a>
											</li>
										{/each}
									</ul>
								</Collapsable.Content>
							</Collapsable.Root>
						</Card.Description>
					</Card.Header>
					<Card.Content class="flex flex-col gap-4">
						<Label class="flex flex-row items-center gap-2">
							<Switch
								onCheckedChange={async (checked) => {
									const dataButMutable = event;
									dataButMutable.locked = checked;
									await setDoc(
										doc(db, 'events', event.event ?? ''),
										{
											locked: checked,
										},
										{
											merge: true,
										},
									);
								}}
								checked={event.locked ?? false}
							/>
							Lock event
						</Label>
						{#if event.event === 'Technology Bowl'}
							<p>
								The team for this event will be based off of a test which you
								will take at a later date.
							</p>
						{/if}
						{#each event.teams as team}
							<Card.Root
								class="{team.members.length > event.maxTeamSize ||
								team.members.length < event.minTeamSize
									? 'bg-red-300 dark:bg-red-950'
									: team.members.length === event.maxTeamSize
									  ? 'bg-green-300 dark:bg-green-950'
									  : 'bg-blue-100 dark:bg-slate-900'} bg-opacity-20"
							>
								<Card.Title class="m-2 ml-4 flex flex-col gap-2">
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
																{person.name}
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
																			},
																			{
																				merge: true,
																			},
																		);
																		confetti();
																		yay.play();
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
															},
															{
																merge: true,
															},
														);
													}}>Clear</Button
												>
												<ul>
													{#each team.members as teamMember}
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
																	},
																	{
																		merge: true,
																	},
																);
															}}
														>
															{teamMember.name}
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
											href="mailto:?cc={board.join(';')}&bcc={team.members
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
								</Card.Title>
								<Card.Content>
									<div class="mb-4">
										<Collapsable.Root>
											<Collapsable.Trigger asChild let:builder>
												<Button
													builders={[builder]}
													variant="ghost"
													size="sm"
													class="p-2 flex items-center w-full"
												>
													Manage Requests
													<div class="flex-1" />
													<ChevronsUpDown />
												</Button>
											</Collapsable.Trigger>
											<Collapsable.Content class="px-2">
												<ul>
													{#each team.requests ?? [] as request}
														<li class="flex flex-row">
															{request.name}
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
																		},
																		{
																			merge: true,
																		},
																	);
																	confetti();
																	yay.play();
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
																			{person.name}
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
																						},
																						{
																							merge: true,
																						},
																					);
																					sendEmail(
																						team.members.map((m) => m.email),
																						'New team request',
																						`${
																							$user?.displayName ?? 'Someone'
																						} has requested to join your team for ${
																							event.event
																						}. Please go to the <a href="https://tsa-grouping-thing.vercel.app">team creation wizard</a> to accept or deny the request.<br /><br />- JHS TSA Board<br />Please do not reply to this email; it comes from an unmonitored email address.`,
																					);
																					confetti();
																					yay.play();
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
												<a
													href="/events/{encodeURIComponent(teamMember.email)}"
												>
													{teamMember.name}
												</a>
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
					<Card.Footer>
						<Button
							on:click={async () => {
								event.teams.push({
									members: [],
									lastUpdatedBy: $user?.email ?? '',
								});
								await setDoc(
									doc(db, 'events', event.event ?? ''),
									{
										teams: event.teams,
									},
									{
										merge: true,
									},
								);
							}}
						>
							Create Team
						</Button>
					</Card.Footer>
				</Card.Root>
			{/if}
		{:else}
			{#each { length: 9 } as _}
				<Skeleton class="h-[32rem] w-full" />
			{/each}
		{/each}
	</div>
</div>
