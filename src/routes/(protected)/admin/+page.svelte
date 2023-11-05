<script lang="ts">
	import { page } from '$app/stores';
	import { auth, db, yay, type EventDoc, type UserDoc, aww } from '$lib';
	import { board } from '$lib/board';
	import { Button } from '$lib/components/button';
	import * as Card from '$lib/components/card';
	import * as Dialog from '$lib/components/dialog';
	import { Input } from '$lib/components/input';
	import Label from '$lib/components/label/label.svelte';
	import { Switch } from '$lib/components/switch';
	import * as Tooltip from '$lib/components/tooltip';
	import confetti from 'canvas-confetti';
	import {
		doc,
		setDoc,
		Timestamp,
		type DocumentData,
	} from 'firebase/firestore';
	import Fuse from 'fuse.js';
	import { Crown, Mail, Minus, Plus, Trash2, UserPlus } from 'lucide-svelte';
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

	const correctType = (eventData: DocumentData) =>
		eventData as {
			name: string;
			members: { name: string; email: string }[];
			teamCaptain?: string;
			lastUpdatedBy?: string;
			lastUpdatedTime?: Timestamp;
			locked?: boolean;
			[key: string]: unknown;
		};

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
</script>

<div class="mt-8 flex flex-col items-center container">
	<h1 class="text-3xl font-bold my-4 mb-6">
		Please don't add yourself to events that you aren't in!
	</h1>
	<div class="w-full mb-4 flex flex-col md:flex-row gap-4">
		<Label class="flex flex-row items-center">
			<Switch class="mr-2" bind:checked={fuseKeys.event}></Switch>
			Search by events
		</Label>
		<Label class="flex flex-row items-center">
			<Switch class="mr-2" bind:checked={fuseKeys.members}></Switch>
			Search by members
		</Label>
		<Label class="flex flex-row items-center">
			<Switch class="mr-2" bind:checked={shouldHideIndividualEvents}></Switch>
			Hide individual events
		</Label>
		<Label class="flex flex-row items-center">
			<Switch class="mr-2" bind:checked={onlyShowOverflown}></Switch>
			Only show overflown events
		</Label>
	</div>
	<Input class="mb-4" bind:value={search} placeholder="Search" />

	<p class="mb-4">Green team: full; red team: over or underfilled</p>
	<div
		class="grid items-center gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 lg:items-start"
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
						<Card.Title>{event.event}</Card.Title>
						<Card.Description>
							<ul>
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
								<details>
									<summary>People not in teams</summary>
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
										on:click={() => {
											if (
												confirm(
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
								</details>
							{/if}
							<details>
								<summary>Events without member overlap</summary>
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
							</details>
							<details>
								<summary>Everyone in event</summary>
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
							</details>
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
						{#each event.teams as te}
							{@const team = correctType(te)}
							<Card.Root
								class=" {team.members.length > event.maxTeamSize ||
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
													!confirm('Are you sure you want to delete this team?')
												)
													return;
												const teamsButMutable = event;
												teamsButMutable.teams = event.teams.filter(
													(t) => t !== te,
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
															.sort( (a, b) => a?.name?.localeCompare(b?.name), ) as person}
															<li
																class:text-green-500={$usersDoc
																	.filter((m) =>
																		m.events.includes(event.event ?? ''),
																	)
																	.find(
																		(e) => e.email === (person?.email ?? ''),
																	)}
																class="flex flex-row items-center"
															>
																{person.name}
																<Button
																	on:click={async () => {
																		const teamButMutable = team;
																		teamButMutable.members.push({
																			name: person.name,
																			email: person.email,
																		});
																		teamButMutable.lastUpdatedBy =
																			$user?.email ?? '';
																		teamButMutable.lastUpdatedTime =
																			new Timestamp(Date.now() / 1000, 0);

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
																	class="ml-2"><Plus /></Button
																>
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
														const teamButMutable = team;
														teamButMutable.teamCaptain = '';
														teamButMutable.lastUpdatedBy = $user?.email ?? '';
														teamButMutable.lastUpdatedTime = new Timestamp(
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
																const teamButMutable = team;
																teamButMutable.teamCaptain =
																	teamMember?.email ?? '';
																teamButMutable.lastUpdatedBy =
																	$user?.email ?? '';
																teamButMutable.lastUpdatedTime = new Timestamp(
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
									<div>
										<Button
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
													const teamButMutable = team;
													teamButMutable.locked = checked;
													teamButMutable.lastUpdatedBy = $user?.email ?? '';
													teamButMutable.lastUpdatedTime = new Timestamp(
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
									<ul>
										{#each team.members as teamMember}
											<li
												class:text-green-500={$usersDoc
													.filter((m) => m.events.includes(event.event ?? ''))
													.find(
														(e) =>
															e.email?.toLowerCase() ===
															teamMember.email.toLowerCase(),
													)}
												class="flex flex-row items-center gap-2"
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
													class="bg-transparent h-5"
													variant="outline"
													on:click={async () => {
														const teamButMutable = team;
														teamButMutable.members.splice(
															teamButMutable.members.findIndex(
																(e) =>
																	e.email === (teamMember?.email ?? '') &&
																	e.name === (teamMember?.name ?? ''),
															),
															1,
														);
														teamButMutable.lastUpdatedBy = $user?.email ?? '';
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
		{/each}
	</div>
</div>
