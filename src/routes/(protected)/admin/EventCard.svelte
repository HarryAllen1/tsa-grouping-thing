<script lang="ts">
	import {
		allUsersCollection,
		db,
		fancyConfirm,
		md,
		settings,
		user,
		type EventData,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { deleteDoc, doc, setDoc } from 'firebase/firestore';
	import { ChevronsUpDown, Download, Trash2 } from 'lucide-svelte';
	import TeamCard from './TeamCard.svelte';
	import UserCard from './UserCard.svelte';

	export let hidden: boolean;
	export let event: EventData;
	export let eventData: EventData[];
	export let changeSearch: (s: string) => void;

	const reallyStupidFunction = (arr: unknown[]) =>
		arr as {
			name: string;
			email: string;
		}[];

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
	const submissionDescriptionElementMap: Record<string, Textarea> = {};
</script>

<Card.Root class={hidden ? 'hidden' : ''}>
	<Card.Header>
		<Card.Title class="flex flex-row items-center">
			<span>{event.event}</span>
			<div class="flex-grow" />
			{#if event.event === '*Rooming'}
				<Button
					size="icon"
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
					Max {event.perChapter} teams per chapter (currently {event.teams
						.length})
				</li>
				<li>
					{event.teams.reduce(
						(acc, curr) => acc + curr.members.length,
						0,
					)}/{event.event === '*Rooming'
						? $allUsersCollection.filter((u) => u.events.length > 0).length
						: eventData.find((e) => e.event === event.event)?.members.length ??
							0} people joined {event.event === '*Rooming' ? 'rooms' : 'teams'}
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
			{#if event.event !== '*Rooming'}
				<div class="flex flex-col gap-2">
					<p class="text-black dark:text-white">Submission description:</p>
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
													submissionDescriptionElementMap[event.event]?.value ??
													'',
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
									(e) => e.email?.toLowerCase() === m.email?.toLowerCase(),
								),
						)
					: $allUsersCollection.filter(
							(m) =>
								m.events.includes(event.event ?? '') &&
								!peopleInTeams.find(
									(e) => e.email?.toLowerCase() === m.email?.toLowerCase(),
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
							People not in {event.event === '*Rooming' ? 'rooms' : 'teams'} ({peopleNotInTeams.length})
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
													doc(db, 'users', userDoc.email?.toLowerCase() ?? ''),
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
										on:click={() => changeSearch(e.event)}
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
						(acc, curr) => [...acc, ...curr.members],
						reallyStupidFunction([]),
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
							<div class="flex-1" />
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
		</Card.Description>
	</Card.Header>
	<Card.Content class="flex flex-col gap-4">
		{#if event.event === '*Rooming'}
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
		{/if}
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
				<Label for="lock-team-creation">Lock team creation when full</Label>
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
			<TeamCard {event} {team} />
		{/each}
	</Card.Content>
	<Card.Footer class="space-x-2">
		<Button
			on:click={async () => {
				let lowestNotTaken = 1;
				while (event.teams.find((t) => t.teamNumber === lowestNotTaken)) {
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
							while (event.teams.find((t) => t.teamNumber === lowestNotTaken)) {
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
