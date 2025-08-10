<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { db } from '$lib/firebase';
	import { user, userDoc } from '$lib/stores';
	import type { EventDoc, Team } from '$lib/types';
	import { doc, Timestamp, updateDoc } from 'firebase/firestore';

	let {
		team,
		event,
	}: {
		team: Team;
		event: EventDoc;
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

	let checkInDialogOpen = $state(false);

	let selectedPreparationLevel = $state<string | undefined>(
		team.preparationLevel,
	);
	let preparationLevelDescription = $state<string>(
		team.preparationLevelDescription ?? '',
	);
</script>

<Dialog.Root
	bind:open={checkInDialogOpen}
	onOpenChange={async (state) => {
		if (!state) {
			team.lastUpdatedBy = $user?.email ?? '';
			team.lastUpdatedTime = Timestamp.now();
			team.preparationLevelDescription = preparationLevelDescription;
			await updateDoc(doc(db, 'events', event.event ?? ''), {
				teams: event.teams,
				lastUpdatedBy: $user?.email ?? '',
			});
		}
	}}
>
	<Dialog.Trigger
		class={buttonVariants({
			variant: team.checkInComplete ? 'outline' : 'default',
		})}
	>
		{team.checkInComplete ? 'Edit' : 'Complete'} Check-in
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Event Status Check-in</Dialog.Title>
			<Dialog.Description>
				This is required to ensure you are on-track and prepared for the January
				virtual qualifier and the State conference. Please complete one check-in
				per event.
			</Dialog.Description>
		</Dialog.Header>

		<Label>
			As of right now, how prepared do you feel you/your team is for this event?
		</Label>
		<Select.Root
			type="single"
			bind:value={selectedPreparationLevel}
			onValueChange={async (value) => {
				team.preparationLevel = value;
				team.lastUpdatedBy = $user?.email ?? '';
				team.lastUpdatedTime = Timestamp.now();

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

		<Label for="checkinResponse">
			Please briefly elaborate on your response. If you feel you are
			well-prepared, please comment on your progress. If you feel unprepared,
			please briefly describe your plan of work. (required)
		</Label>
		<Textarea
			autosize
			required
			id="checkinResponse"
			bind:value={preparationLevelDescription}
		/>

		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={() => {
					if (confirm('Are you sure you want to close this dialog?')) {
						checkInDialogOpen = false;
					}
				}}
			>
				Close
			</Button>
			<div class="grow"></div>
			{#if team.checkInComplete}
				<Button
					onclick={async () => {
						team.lastUpdatedBy = $user?.email ?? '';
						team.lastUpdatedTime = Timestamp.now();
						team.preparationLevelDescription = preparationLevelDescription;
						await updateDoc(doc(db, 'events', event.event ?? ''), {
							teams: event.teams,
							lastUpdatedBy: $user?.email ?? '',
						});
						checkInDialogOpen = false;
					}}
				>
					Save
				</Button>
			{:else}
				<Button
					variant="outline"
					class="my-2 md:my-0"
					onclick={async () => {
						team.lastUpdatedBy = $user?.email ?? '';
						team.lastUpdatedTime = Timestamp.now();
						team.preparationLevelDescription = preparationLevelDescription;
						await updateDoc(doc(db, 'events', event.event ?? ''), {
							teams: event.teams,
							lastUpdatedBy: $user?.email ?? '',
						});
						checkInDialogOpen = false;
					}}
				>
					Save for Later
				</Button>
				<Button
					onclick={async () => {
						if (
							!team.preparationLevel ||
							preparationLevelDescription.length === 0
						) {
							return alert('Please fill out all fields');
						}
						team.checkInComplete = true;
						team.lastUpdatedBy = $user?.email ?? '';
						team.lastUpdatedTime = Timestamp.now();
						team.preparationLevelDescription = preparationLevelDescription;
						team.checkInSubmittedTime = Timestamp.now();
						team.checkInSubmittedBy = {
							email: $userDoc.email ?? '',
							name: $userDoc.name ?? '',
						};

						await updateDoc(doc(db, 'events', event.event ?? ''), {
							teams: event.teams,
							lastUpdatedBy: $user?.email ?? '',
						});
						checkInDialogOpen = false;
					}}
					disabled={!selectedPreparationLevel ||
						preparationLevelDescription.length === 0}
				>
					Mark as Complete
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
