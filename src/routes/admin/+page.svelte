<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, db, events, memberData } from '$lib';
	import NoDollar from '$lib/NoDollar.svelte';
	import { actuallyPaid } from '$lib/actuallyPaid';
	import { Button } from '$lib/components/button';
	import * as Card from '$lib/components/card';
	import * as Dialog from '$lib/components/dialog';
	import { Input } from '$lib/components/input';
	import Label from '$lib/components/label/label.svelte';
	import { Switch } from '$lib/components/switch';
	import * as Tooltip from '$lib/components/tooltip';
	import { correctDocType, correctTeamsDataType } from '$lib/types';
	import { signOut } from 'firebase/auth';
	import {
		Timestamp,
		doc,
		setDoc,
		type DocumentData,
	} from 'firebase/firestore';
	import Fuse from 'fuse.js';
	import { Crown, Plus, Trash2, UserPlus } from 'lucide-svelte';
	import { Doc, userStore } from 'sveltefire';
	import { admins } from '../admins';

	const user = userStore(auth);

	if (!$user || !admins.includes($user.email?.toLowerCase() ?? '')) {
		goto('/');
	}

	let search = '';

	const eventData = memberData
		.reduce(
			(acc, item) => {
				item.events.forEach((eventName) => {
					const existingEntry = acc.find((entry) => entry.event === eventName);

					if (existingEntry) {
						existingEntry.members.push({
							name: item.name,
							id: item.id,
							email: item.email,
						});
					} else {
						acc.push({
							event: eventName,
							members: [{ name: item.name, id: item.id, email: item.email }],
						});
					}
				});

				return acc;
			},
			[] as {
				event: string;
				members: { name: string; id: string; email: string }[];
			}[],
		)
		.map((e) => {
			const event = events.find((ev) => ev.event === e.event)!;
			return {
				...e,
				...event,
			};
		})
		.sort((a, b) => a.event.localeCompare(b.event));

	let shouldHideIndividualEvents = false;

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
	const signedUpEvents = eventData;
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

	export const reallyStupidFunction = (arr: Array<unknown>) =>
		arr as {
			name: string;
			email: string;
		}[];
</script>

<div class="mt-8 flex flex-col items-center">
	<Button on:click={() => signOut(auth)}>Sign out</Button>
	<Button href="/" class="my-4">Back to regular sign up page</Button>
	<h1 class="text-3xl font-bold max-w-screen-md m-4">
		Please don't add yourself to events that you aren't in! If people want you
		to add them to an event they aren't in, tell them to edit their event
		sign-up form, then message Harry so he can update this page.
	</h1>

	<div class="w-full mb-4 flex flex-row gap-4">
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
			<Input type="number" bind:value={threshold} min="0" max="1" step="0.1" />
			Threshold
		</Label>
	</div>
	<Input class="mb-4" bind:value={search} placeholder="Search" />

	<p class="mb-4">Green team: full; red team: over or underfilled</p>
	<div
		class="flex flex-col items-center gap-4 lg:grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 lg:items-start"
	>
		{#each signedUpEvents as event}
			<Doc ref="events/{event.event}" let:data={untyped}>
				{@const data = correctDocType(untyped)}
				{#if !shouldHideIndividualEvents || (shouldHideIndividualEvents && event.maxTeamSize > 1)}
					<Card.Root
						class="w-[350px] {eventResults.includes(event.event)
							? ''
							: 'hidden'}"
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
									<li class:text-red-500={data.teams.length > event.perChapter}>
										Max {event.perChapter} teams per chapter (currently {data
											.teams.length})
									</li>
									<li>
										{data.teams.reduce(
											(acc, curr) => acc + curr.members.length,
											0,
										)}/{eventData.find((e) => e.event === event.event)?.members
											.length ?? 0} people joined teams
									</li>
								</ul>
								{@const peopleInTeams = data.teams.reduce(
									(acc, curr) => [...acc, ...curr.members],
									reallyStupidFunction([]),
								)}
								{@const peopleNotInTeams = memberData.filter(
									(m) =>
										m.events.includes(event.event ?? '') &&
										!peopleInTeams.find(
											(e) => e.email.toLowerCase() === m.email.toLowerCase(),
										),
								)}
								{#if peopleNotInTeams.length}
									<details>
										<summary>People not in teams</summary>
										<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
											{#each peopleNotInTeams as person}
												<li>{person.name}</li>
											{/each}
										</ul>
									</details>
								{/if}
							</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<Label class="flex flex-row items-center gap-2">
								<Switch
									onCheckedChange={async (checked) => {
										const dataButMutable = data;
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
									checked={data.locked ?? false}
								/>
								Lock event
							</Label>
							{#if event.event === 'Technology Bowl'}
								<p>
									The team for this event will be based off of a test which you
									will take at a later date.
								</p>
							{/if}
							{#each data.teams as te}
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
												on:click={async () => {
													if (
														!confirm(
															'Are you sure you want to delete this team?',
														)
													)
														return;
													const teamsButMutable = data;
													teamsButMutable.teams = data.teams.filter(
														(t) => t !== te,
													);
													await setDoc(
														doc(db, 'events', event.event ?? ''),
														{
															teams: data.teams,
														},
														{
															merge: true,
														},
													);
												}}
											>
												<Trash2 />
											</Button>
											<Dialog.Root>
												<Dialog.Trigger>
													<Button class="bg-green-500 hover:bg-green-400">
														<UserPlus />
													</Button>
												</Dialog.Trigger>

												<Dialog.Content class="max-h-full overflow-y-scroll">
													<Dialog.Title>Add People</Dialog.Title>
													<Dialog.Description>
														<p>All people not already in a team:</p>
														<ul>
															{#each memberData
																.filter((p) => !correctTeamsDataType(data.teams).find( (t) => t.members?.find((e) => e.email.toLowerCase() === p.email.toLowerCase()), ))
																.sort( (a, b) => a.name.localeCompare(b.name), ) as person}
																<li
																	class:text-green-500={memberData
																		.filter((m) =>
																			m.events.includes(event.event ?? ''),
																		)
																		.find(
																			(e) => e.email === (person?.email ?? ''),
																		)}
																	class="flex flex-row items-center"
																>
																	{person.name}
																	{#if !actuallyPaid.includes(person.email.toLowerCase())}
																		<Tooltip.Root>
																			<Tooltip.Trigger>
																				<NoDollar class="h-6 w-6 ml-2" />
																			</Tooltip.Trigger>
																			<Tooltip.Content
																				>This person didn't pay the $28 TSA fee</Tooltip.Content
																			>
																		</Tooltip.Root>
																	{/if}
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
																					teams: data.teams,
																				},
																				{
																					merge: true,
																				},
																			);
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
																	teams: data.teams,
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
																	teamButMutable.lastUpdatedTime =
																		new Timestamp(Date.now() / 1000, 0);
																	await setDoc(
																		doc(db, 'events', event.event ?? ''),
																		{
																			teams: data.teams,
																		},
																		{
																			merge: true,
																		},
																	);
																}}
															>
																{teamMember.name}
																{#if !actuallyPaid.includes(teamMember.email.toLowerCase())}
																	<Tooltip.Root>
																		<Tooltip.Trigger>
																			<NoDollar class="h-6 w-6 ml-2" />
																		</Tooltip.Trigger>
																		<Tooltip.Content
																			>This person didn't pay the $28 TSA fee</Tooltip.Content
																		>
																	</Tooltip.Root>
																{/if}
																{#if team.teamCaptain?.toLowerCase() === teamMember.email.toLowerCase()}
																	<Tooltip.Root>
																		<Tooltip.Trigger>
																			<Crown class="h-4 w-4" />
																		</Tooltip.Trigger>
																		<Tooltip.Content
																			>Team captain</Tooltip.Content
																		>
																	</Tooltip.Root>
																{/if}
															</li>
														{/each}
													</ul>
												</Dialog.Content>
											</Dialog.Root>
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
																teams: data.teams,
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
												<!-- svelte-ignore a11y-click-events-have-key-events -->
												<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
												<li
													class:text-green-500={memberData
														.filter((m) => m.events.includes(event.event ?? ''))
														.find(
															(e) =>
																e.email.toLowerCase() ===
																(teamMember?.email.toLowerCase() ?? ''),
														)}
													class="hover:underline hover:text-red-500 hover:cursor-pointer"
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
																teams: data.teams,
															},
															{
																merge: true,
															},
														);
													}}
												>
													{teamMember.name}
													{#if !actuallyPaid.includes(teamMember.email.toLowerCase())}
														<Tooltip.Root>
															<Tooltip.Trigger>
																<NoDollar class="h-4 w-4" />
															</Tooltip.Trigger>
															<Tooltip.Content
																>This person didn't pay the $28 TSA fee</Tooltip.Content
															>
														</Tooltip.Root>
													{/if}
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
									</Card.Content>
								</Card.Root>
							{/each}
						</Card.Content>
						<Card.Footer>
							<Button
								on:click={async () => {
									data.teams.push({
										members: [],
										lastUpdatedBy: $user?.email ?? '',
									});
									await setDoc(
										doc(db, 'events', event.event ?? ''),
										{
											teams: data.teams,
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
			</Doc>
		{/each}
	</div>
</div>
