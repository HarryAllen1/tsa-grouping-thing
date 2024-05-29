<script lang="ts">
	import {
		allUsersCollection,
		db,
		user,
		userDoc,
		type EventData,
		type EventDoc,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { doc, setDoc } from 'firebase/firestore';
	import TeamCard from './TeamCard.svelte';

	let { event, eventData }: { event: EventDoc; eventData: EventData[] } =
		$props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>
			{event.event}
		</Card.Title>
		<Card.Description>
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
						: eventData.find((e) => e.event === event.event)?.members.length ??
							0} people joined {event.event === '*Rooming' ? 'rooms' : 'teams'}
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
		{#each event.teams as team (team.id)}
			<TeamCard {event} {team} />
		{/each}
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
					) || event.event === 'Technology Bowl'
				)}
				on:click={async () => {
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
