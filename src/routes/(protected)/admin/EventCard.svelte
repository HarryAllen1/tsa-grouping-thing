<script lang="ts">
	import {
		allUsersCollection,
		db,
		fancyConfirm,
		md,
		user,
		type EventData,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { deleteDoc, deleteField, doc, setDoc } from 'firebase/firestore';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import Download from 'lucide-svelte/icons/download';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Settings from 'lucide-svelte/icons/settings';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import TeamCard from './TeamCard.svelte';
	import UserCard from './UserCard.svelte';

	let {
		hidden,
		event = $bindable(),
		eventData,
		changeSearch,
	}: {
		hidden: boolean;
		event: EventData;
		eventData: EventData[];
		changeSearch: (s: string) => void;
	} = $props();

	let originalName = event.event;
	const intersect = <T,>(a: T[], b: T[]): T[] => {
		const setB = new Set(b);
		return [...new Set(a)].filter((x) => setB.has(x));
	};
	const nonOverlappingEvents = (event: EventData) =>
		eventData.filter(
			(e) =>
				intersect(
					e.members.map((m) => m.name),
					event.members.map((m) => m.name),
				).length === 0,
		);
	let submissionDescription = $state<string | number | string[] | null>(
		event.submissionDescription ?? '',
	);
	let submissionDialogOpen = $state(false);
	let editEventDialogOpen = $state(false);
	let collapsibleOpen = $state(false);
</script>

<Card.Root class={hidden ? 'hidden' : ''}>
	<Card.Header>
		<Card.Title class="flex flex-row items-center">
			<span>{event.event}</span>
			<div class="flex-grow"></div>
			<Dialog.Root bind:open={editEventDialogOpen}>
				<Dialog.Trigger>
					<Button size="icon" variant="ghost">
						<Settings />
					</Button>
				</Dialog.Trigger>
				<Dialog.Content class="max-h-screen overflow-y-scroll">
					<Dialog.Header>
						<Dialog.Title>Event Settings</Dialog.Title>
						<Dialog.Description>Updates automatically</Dialog.Description>
					</Dialog.Header>
					<div class="flex items-center space-x-2">
						<Switch
							id="show-event-to-everyone"
							checked={event.showToEveryone ?? false}
							onCheckedChange={async (e) => {
								await setDoc(
									doc(db, 'events', event.event),
									{
										showToEveryone: e,
										lastUpdatedBy: $user?.email ?? '',
									},
									{ merge: true },
								);
							}}
						/>
						<Label for="show-event-to-everyone">
							{#if event.event === '*Rooming'}
								Show rooming
							{:else}
								Auto-signup everyone
							{/if}
						</Label>
					</div>
					<div class="flex items-center space-x-2">
						<Switch
							id="show-in-signup"
							checked={event.hideInSignup ?? false}
							onCheckedChange={async (e) => {
								await setDoc(
									doc(db, 'events', event.event),
									{
										hideInSignup: e,
										lastUpdatedBy: $user?.email ?? '',
									},
									{ merge: true },
								);
							}}
						/>
						<Label for="show-in-signup">Hide in signup page</Label>
					</div>
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
						<div class="flex items-center space-x-2">
							<Switch
								id="lock-team-creation-but-actually"
								bind:checked={event.teamCreationActuallyLocked}
								onCheckedChange={async (e) => {
									await setDoc(
										doc(db, 'events', event.event),
										{
											teamCreationActuallyLocked: e,
											lastUpdatedBy: $user?.email ?? '',
										},
										{ merge: true },
									);
								}}
							/>
							<Label for="lock-team-creation-but-actually">
								Lock team creation
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
								bind:checked={event.onlineSubmissions}
							/>
							Online submissions
						</Label>

						<Dialog.Header>
							<Dialog.Title>Event Details</Dialog.Title>
							<Dialog.Description>Requires saving</Dialog.Description>
						</Dialog.Header>

						<Label for="eventName">Event name</Label>
						<Input type="text" bind:value={event.event} id="eventName" />
						<Label for="eventDesc">Event description</Label>
						<Input type="text" bind:value={event.description} id="eventDesc" />
						<Label for="minTeamSize">Min team size</Label>
						<Input
							type="number"
							bind:value={event.minTeamSize}
							id="minTeamSize"
						/>
						<Label for="maxTeamSize">Max team size</Label>
						<Input
							type="number"
							bind:value={event.maxTeamSize}
							id="maxTeamSize"
						/>
						<Label for="perChapter">Max teams per chapter</Label>
						<Input
							type="number"
							bind:value={event.perChapter}
							id="perChapter"
						/>

						<Dialog.Footer class="flex flex-row">
							<Button
								variant="destructive"
								on:click={async () => {
									editEventDialogOpen = false;
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
											"This will delete ALL TEAMS and remove this event from everyone's sign up form.",
										))
									)
										return;
									if (
										!prompt(
											'Type "delete this event" to actually delete this event (LAST CHANCE!!!).',
										)
											?.toLowerCase()
											.includes('delete this event')
									)
										return;

									await deleteDoc(doc(db, 'events', event.event ?? ''));
									for (const user of $allUsersCollection) {
										user.events = user.events.filter((e) => e !== event.event);
										await setDoc(
											doc(db, 'users', user.email?.toLowerCase() ?? ''),
											user,
											{ merge: true },
										);
									}
								}}
							>
								Delete Event
							</Button>
							<div class="flex-grow"></div>
							<Button
								class="mr-2"
								variant="ghost"
								on:click={() => {
									editEventDialogOpen = false;
								}}
							>
								Cancel
							</Button>
							<Button
								on:click={async () => {
									await setDoc(
										doc(db, 'events', event.event ?? ''),
										{
											event: event.event,
											description: event.description || deleteField(),
											minTeamSize: event.minTeamSize,
											maxTeamSize: event.maxTeamSize,
											perChapter: event.perChapter,
											lastUpdatedBy: $user?.email ?? '',
											teams: event.teams ?? [],
										},
										{
											merge: true,
										},
									);
									if (originalName !== event.event) {
										await deleteDoc(doc(db, 'events', originalName));
										originalName = event.event;
									}
									editEventDialogOpen = false;
								}}
							>
								Save
							</Button>
						</Dialog.Footer>
					{/if}
				</Dialog.Content>
			</Dialog.Root>
			{#if event.event === '*Rooming'}
				<Button
					size="icon"
					variant="ghost"
					class="mr-2"
					on:click={() => {
						let csv = `Room number,first1,last1,first2,last2,first3,last3,first4,last4\n`;
						for (const team of event.teams) {
							csv += `${team.teamNumber},${team.members
								.map((m) => {
									const person = $allUsersCollection.find(
										(u) => u.email.toLowerCase() === m.email.toLowerCase(),
									);
									return `"${person?.firstName}","${person?.lastName}"`;
								})
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
						document.body.append(link);
						link.click();
						link.remove();
						URL.revokeObjectURL(url);
					}}
				>
					<Download />
				</Button>
			{/if}
		</Card.Title>
		<Card.Description>
			{#if event.description}
				<p>{event.description}</p>
			{/if}
			<ul class="mb-2">
				<li>
					Min {event.minTeamSize} people per team
				</li>
				<li>
					Max {event.maxTeamSize} people per team
				</li>
				<li class:text-red-500={event.teams.length > event.perChapter}>
					Max {event.perChapter} teams per chapter (currently {event.teams
						.length})
				</li>
				<li>
					{event.teams.reduce(
						(acc, curr) => acc + curr.members.length,
						0,
					)}/{event.event === '*Rooming'
						? $allUsersCollection.filter((u) => u.events.length > 0).length
						: (eventData.find((e) => e.event === event.event)?.members.length ??
							0)} people joined {event.event === '*Rooming' ? 'rooms' : 'teams'}
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
							.reduce((acc, curr) => (acc += curr.members.length), 0)} people in
						unfilled rooms
					</li>
				{/if}
			</ul>
		</Card.Description>
	</Card.Header>
	<Card.Content class="flex flex-col gap-4">
		{@const peopleInTeams = event.teams.reduce(
			(acc, curr) => {
				acc.push(...curr.members);
				return acc;
			},
			[] as {
				name: string;
				email: string;
			}[],
		)}
		{@const peopleNotInTeams =
			event.event === '*Rooming'
				? $allUsersCollection.filter(
						(m) =>
							m.events.length > 0 &&
							!peopleInTeams.some(
								(e) => e.email?.toLowerCase() === m.email?.toLowerCase(),
							),
					)
				: $allUsersCollection.filter(
						(m) =>
							m.events.includes(event.event ?? '') &&
							!peopleInTeams.some(
								(e) => e.email?.toLowerCase() === m.email?.toLowerCase(),
							),
					)}
		<div>
			{#if event.event !== '*Rooming'}
				<div class="flex flex-col gap-2">
					<div class="flex flex-row items-center gap-2">
						<h3 class="text-lg font-semibold">Submission description</h3>
						<Dialog.Root bind:open={submissionDialogOpen}>
							<Dialog.Trigger>
								<Button size="icon" variant="ghost">
									<Pencil />
								</Button>
							</Dialog.Trigger>
							<Dialog.Content>
								<Dialog.Title>Edit submission description</Dialog.Title>
								<p>Markdown is allowed</p>
								<Textarea
									placeholder="Submission description"
									class="w-full"
									bind:value={submissionDescription}
								/>
								<Dialog.Footer>
									<Button
										on:click={() => {
											setDoc(
												doc(db, 'events', event.event),
												{
													submissionDescription: submissionDescription ?? '',
													lastUpdatedBy: $user?.email ?? '',
												},
												{
													merge: true,
												},
											);

											submissionDialogOpen = false;
										}}
									>
										Save
									</Button>
								</Dialog.Footer>
							</Dialog.Content>
						</Dialog.Root>
					</div>
					<p class="prose mb-4 text-sm text-inherit dark:prose-invert">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html md.render(event.submissionDescription || '(none)')}
					</p>
				</div>
			{/if}

			{#if peopleNotInTeams.length}
				<Collapsible.Root>
					<Collapsible.Trigger asChild let:builder>
						<Button
							builders={[builder]}
							variant="ghost"
							size="sm"
							class="flex w-full items-center p-2"
						>
							People not in {event.event === '*Rooming' ? 'rooms' : 'teams'} ({peopleNotInTeams.length})
							<div class="flex-1"></div>
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
										for (const person of peopleNotInTeams) {
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
													doc(db, 'users', userDoc.email?.toLowerCase() ?? ''),
													{
														...userDoc,
														lastUpdatedBy: $user?.email ?? '',
													},
													{ merge: true },
												);
											}
										}
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
							<div class="flex-1"></div>
							<ChevronsUpDown />
						</Button>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
							{#each nonOverlappingEvents(event) as e (e.event)}
								<li>
									<button
										class="underline"
										onclick={() => changeSearch(e.event)}
									>
										{e.event}
									</button>
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
							<div class="flex-1"></div>
							<ChevronsUpDown />
						</Button>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<Button
							href="mailto:?cc={$allUsersCollection
								.filter((u) => u.admin)
								.map((u) => u.email)
								.join(';')}&bcc={event.members
								.map((p) => p.email)
								.join(';')}&subject={event.event}"
						>
							Email everyone
						</Button>
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
			{:else}
				{@const peopleInUnfilledRooms = event.teams
					.filter((t) => t.members.length < event.minTeamSize)
					.reduce(
						(acc, curr) => {
							acc.push(...curr.members);
							return acc;
						},
						[] as {
							name: string;
							email: string;
						}[],
					)}
				<Collapsible.Root>
					<Collapsible.Trigger asChild let:builder>
						<Button
							builders={[builder]}
							variant="ghost"
							size="sm"
							class="flex w-full items-center p-2"
						>
							People in unfilled rooms ({peopleInUnfilledRooms.length})
							<div class="flex-1"></div>
							<ChevronsUpDown />
						</Button>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<Button
							href={`mailto:?cc=${$allUsersCollection
								.filter((u) => u.admin)
								.map((u) => u.email)
								.join(';')}&bcc=${peopleInUnfilledRooms
								.map((p) => p.email)
								.join(';')}&subject=${event.event}`}
						>
							Email these people
						</Button>
						<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
							{#each peopleInUnfilledRooms as person (person.email)}
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
		</div>
		<!-- teams loop -->
		{#if event.teams.length <= 5}
			{#each event.teams as team (team.id)}
				<TeamCard {event} {team} />
			{/each}
		{:else}
			<Collapsible.Root bind:open={collapsibleOpen} class="contents">
				{#each event.teams.slice(0, 4) as team (team.id)}
					<TeamCard {event} {team} />
				{/each}
				<Collapsible.Content class="contents">
					{#each event.teams.slice(5) as team (team.id)}
						<TeamCard {event} {team} />
					{/each}
				</Collapsible.Content>
				<Collapsible.Trigger class="w-full">
					<Button variant="ghost" size="sm" class=" w-full">
						<ChevronUp
							class="transition-transform {collapsibleOpen ? '' : 'rotate-180'}"
						/>
					</Button>
				</Collapsible.Trigger>
			</Collapsible.Root>
		{/if}
	</Card.Content>
	<Card.Footer class="space-x-2">
		<Button
			on:click={async () => {
				let lowestNotTaken = 1;
				while (event.teams.some((t) => t.teamNumber === lowestNotTaken)) {
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
		{#if event.maxTeamSize === 1 && event.teams.reduce((acc, curr) => acc + curr.members.length, 0) < event.members.length}
			<Button
				variant="outline"
				on:click={() => {
					for (const member of event.members) {
						if (
							!event.teams.some((t) =>
								t.members.find((m) => m.email === member.email),
							)
						) {
							let lowestNotTaken = 1;
							while (event.teams.some((t) => t.teamNumber === lowestNotTaken)) {
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
