<script lang="ts">
	import { resolveName } from '$lib/better-utils';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { db } from '$lib/firebase';
	import { allUsersCollection, user } from '$lib/stores';
	import type { EventDoc, Team } from '$lib/types';
	import { doc, updateDoc } from 'firebase/firestore';
	import { hideEmpty } from './state';

	let {
		event,
		team,
	}: {
		event: EventDoc;
		team: Team;
	} = $props();

	const preparationLevels: { label: string; value: string }[] = [
		{
			label: '4 - Completely prepared',
			value: '5',
		},
		{
			label: '3 - Mostly prepared',
			value: '4',
		},
		{
			label: '2 - Not very prepared',
			value: '2',
		},
		{
			label: '1 - Not prepared at all',
			value: '1',
		},
	];

	let selectedPreparationLevel = $state<string | undefined>(
		team.preparationLevel,
	);
	let preparationLevelDescription = $state<string>(
		team.preparationLevelDescription ?? '',
	);

	let markedComplete = $state(team.checkInComplete ? 'Yes' : 'No');
</script>

{#if ($hideEmpty && team.checkInComplete) || !$hideEmpty}
	<Card.Root>
		<Card.Header>
			<Card.Title>
				{team.members
					.map((m) =>
						m.email === team.teamCaptain
							? `👑${resolveName(m, $allUsersCollection)}👑`
							: resolveName(m, $allUsersCollection),
					)
					.join(', ')} ({team.teamNumber})
			</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div>
				<Label>Check-in marked as complete?</Label>
				<Select.Root
					type="single"
					bind:value={markedComplete}
					onValueChange={async (value) => {
						team.checkInComplete = value === 'Yes';

						await updateDoc(doc(db, 'events', event.event ?? ''), {
							teams: event.teams,
							lastUpdatedBy: $user?.email ?? '',
						});
					}}
				>
					<Select.Trigger>
						{team.checkInComplete ? 'Yes' : 'No'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="Yes">Yes</Select.Item>
						<Select.Item value="No">No</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
			{#if team.checkInComplete}
				{@const date = team.checkInSubmittedTime?.toDate()}
				<p class="text-sm">
					Check in completed at {date?.toString()}
				</p>
				<p class="text-sm">
					Check in completed by {team.checkInSubmittedBy
						? resolveName(team.checkInSubmittedBy, $allUsersCollection)
						: 'Unknown'}
				</p>
			{/if}

			<div>
				<Label>
					As of right now, how prepared do you feel your team is for this event?
				</Label>
				<Select.Root
					type="single"
					bind:value={selectedPreparationLevel}
					onValueChange={async (value) => {
						team.preparationLevel = value;

						await updateDoc(doc(db, 'events', event.event ?? ''), {
							teams: event.teams,
							lastUpdatedBy: $user?.email ?? '',
						});
					}}
				>
					<Select.Trigger>
						{team.preparationLevel
							? preparationLevels.find(
									(level) => level.value === team.preparationLevel,
								)?.label
							: 'Select a level'}
					</Select.Trigger>
					<Select.Content>
						{#each preparationLevels as level}
							<Select.Item value={level.value}>{level.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			{@const id = `checkinResponse-${event.event.slice(0, 4)}-${team.teamNumber}`}
			<div>
				<Label for={id}>
					Please briefly elaborate on your response. If you feel you are
					well-prepared, please comment on your progress. If you feel
					unprepared, please briefly describe your plan of work. (required)
				</Label>
				<Textarea
					autosize
					required
					{id}
					bind:value={preparationLevelDescription}
				/>
			</div>
		</Card.Content>
		<Card.Footer>
			<Button
				onclick={async () => {
					team.preparationLevelDescription = preparationLevelDescription;

					await updateDoc(doc(db, 'events', event.event ?? ''), {
						teams: event.teams,
						lastUpdatedBy: $user?.email ?? '',
					});
				}}
			>
				Save
			</Button>
		</Card.Footer>
	</Card.Root>
{/if}
