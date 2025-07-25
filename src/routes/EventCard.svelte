<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { createTeam } from '$lib/functions';
	import { allUsersCollection, user, userDoc } from '$lib/stores';
	import type { EventData, EventDoc, Team } from '$lib/types';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
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
		{#each teams.slice(0, 4) as team (team.id)}
			<TeamCard {event} {team} />
		{/each}
		<Collapsible.Root bind:open={collapsibleOpen}>
			<Collapsible.Content
				class="{collapsibleOpen ? 'flex' : ''} flex-col gap-4"
			>
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
				<li class={[event.teams.length > event.perChapter && 'text-red-500']}>
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
			<p class="text-sm [&:not(:first-child)]:mt-6">
				This event is locked, likely due to eliminations. If this doesn't seem
				correct, contact a JHS TSA board member.
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
	{#if !event.locked && !(event.teamCreationLocked && event.teams.length >= event.perChapter)}
		<Card.Footer>
			<Button
				disabled={!!(
					event.teams.some((t) =>
						t.members.find(
							(e) => e.email.toLowerCase() === ($user?.email ?? ''),
						),
					) || event.teamCreationActuallyLocked
				)}
				onclick={async (mouseEvent) => {
					(mouseEvent.target as HTMLButtonElement).disabled = true;

					await createTeam({
						event: event.event,
					});

					(mouseEvent.target as HTMLButtonElement).disabled = false;
				}}
			>
				Create {event.event === '*Rooming' ? 'Room' : 'Team'}
			</Button>
		</Card.Footer>
	{/if}
</Card.Root>
