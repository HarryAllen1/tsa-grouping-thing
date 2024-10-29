<script lang="ts">
	import {
		allUsersCollection,
		db,
		user,
		userDoc,
		type Team,
		type EventData,
		type EventDoc,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { doc, setDoc } from 'firebase/firestore';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import TeamCard from './TeamCard.svelte';

	let { event, eventData }: { event: EventDoc; eventData: EventData[] } =
		$props();

	let collapsibleOpen = $state(false);
</script>

{#snippet renderTeams(teams: Team[])}
	{#if teams.length <= 5}
		{#each teams as team (team.id)}
			<TeamCard {event} {team} />
		{/each}
	{:else}
		<Collapsible.Root bind:open={collapsibleOpen} class="contents">
			{#each teams.slice(0, 4) as team (team.id)}
				<TeamCard {event} {team} />
			{/each}
			<Collapsible.Content class="contents">
				{#each teams.slice(4) as team (team.id)}
					<TeamCard {event} {team} />
				{/each}
			</Collapsible.Content>
			<Collapsible.Trigger class="w-full">
				{#snippet child({ props })}
					<Button variant="ghost" size="sm" class=" w-full" {...props}>
						<ChevronUp
							class="transition-transform {collapsibleOpen ? '' : 'rotate-180'}"
						/>
					</Button>
				{/snippet}
			</Collapsible.Trigger>
		</Collapsible.Root>
	{/if}
{/snippet}

<Card.Root>
	<Card.Header>
		<Card.Title>
			{event.event}
		</Card.Title>
		<Card.Description>
			{#if event.description}
				<p>{event.description}</p>
			{/if}
			<ul>
				<li>
					Min {event.minTeamSize} people per {event.event === '*Rooming'
						? 'room'
						: 'team'}
				</li>
				<li>
					Max {event.maxTeamSize} people per {event.event === '*Rooming'
						? 'room'
						: 'team'}
				</li>
				<li class:text-red-500={event.teams.length > event.perChapter}>
					Max {event.perChapter}
					{event.event === '*Rooming' ? 'rooms' : 'teams'} per chapter (currently
					{event.teams.length})
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
			</ul>
		</Card.Description>
	</Card.Header>

	<Card.Content class="flex flex-col gap-4">
		{#if event.locked}
			<p>
				This event is locked, likely due to eliminations. If this doesn't seem
				correct, contact a board member.
			</p>
		{/if}

		{@const usersTeam = event.teams.find((t) =>
			t.members.some((m) => m.email === $userDoc.email),
		)}
		{#if usersTeam}
			<TeamCard {event} team={usersTeam} />
			{@render renderTeams(event.teams.filter((t) => t.id !== usersTeam.id))}
		{:else}
			{@render renderTeams(event.teams)}
		{/if}
	</Card.Content>
	{#if !event.locked && !(event.teamCreationLocked && event.teams.length >= event.perChapter) && event.teams.filter( (t) => t.requests
					?.map((r) => r.email)
					.includes($user?.email ?? ''), ).length === 0}
		<Card.Footer>
			<Button
				disabled={!!(
					event.teams.some((t) =>
						t.members.find(
							(e) => e.email.toLowerCase() === ($user?.email ?? ''),
						),
					) || event.teamCreationActuallyLocked
				)}
				onclick={async () => {
					let lowestNotTaken = 1;
					while (event.teams.some((t) => t.teamNumber === lowestNotTaken)) {
						lowestNotTaken++;
					}

					event.teams.push({
						members: [
							{
								name: $userDoc?.name ?? '',
								email: $user?.email ?? '',
							},
						],
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
				Create {event.event === '*Rooming' ? 'Room' : 'Team'}
			</Button>
		</Card.Footer>
	{/if}
</Card.Root>
