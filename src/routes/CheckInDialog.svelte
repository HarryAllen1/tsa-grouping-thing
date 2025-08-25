<script lang="ts">
	import { disableOnClick } from '$lib/better-utils';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { fancyConfirm } from '$lib/FancyConfirm.svelte';
	import { saveCheckIn } from '$lib/functions';
	import type { EventDoc, Team } from '$lib/types';
	import { watch } from 'runed';

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

	watch(
		() => team,
		() => {
			if (!checkInDialogOpen) {
				selectedPreparationLevel =
					team.preparationLevel ?? selectedPreparationLevel;
				preparationLevelDescription =
					team.preparationLevelDescription ?? preparationLevelDescription;
			}
		},
	);
</script>

<Dialog.Root
	bind:open={checkInDialogOpen}
	onOpenChange={async (state) => {
		if (!state) {
			await saveCheckIn({
				event: event.event,
				teamId: team.id,
				preparationLevelDescription,
				preparationLevel: Number(selectedPreparationLevel) as 1 | 2 | 3 | 4,
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
				This is required to ensure you are on-track and prepared for the
				deadlines throughout the year. Please complete one check-in per event.
			</Dialog.Description>
		</Dialog.Header>

		<Label>
			As of right now, how prepared do you feel you/your team is for this event?
		</Label>
		<Select.Root type="single" bind:value={selectedPreparationLevel}>
			<Select.Trigger>
				{selectedPreparationLevel
					? preparationLevels.find(
							(level) => level.value === selectedPreparationLevel,
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
					variant="outline"
					{@attach disableOnClick(async () => {
						await saveCheckIn({
							event: event.event,
							teamId: team.id,
							markAsComplete: false,
							preparationLevelDescription,
							preparationLevel: Number(selectedPreparationLevel) as
								| 1
								| 2
								| 3
								| 4,
						});

						checkInDialogOpen = false;
					})}
				>
					Unsubmit
				</Button>
				<Button
					{@attach disableOnClick(async () => {
						if (
							!selectedPreparationLevel ||
							preparationLevelDescription.length === 0
						) {
							return fancyConfirm(
								'Please fill out all fields',
								'You must fill out the preparation level and description to complete your check in.',
								[['OK', true]],
							);
						}

						await saveCheckIn({
							event: event.event,
							teamId: team.id,
							markAsComplete: true,
							preparationLevelDescription,
							preparationLevel: Number(selectedPreparationLevel) as
								| 1
								| 2
								| 3
								| 4,
						});

						checkInDialogOpen = false;
					})}
				>
					Save
				</Button>
			{:else}
				<Button
					variant="outline"
					class="my-2 md:my-0"
					{@attach disableOnClick(async () => {
						await saveCheckIn({
							event: event.event,
							teamId: team.id,
							markAsComplete: false,
							preparationLevelDescription,
							preparationLevel: Number(selectedPreparationLevel) as
								| 1
								| 2
								| 3
								| 4,
						});

						checkInDialogOpen = false;
					})}
				>
					Save for Later
				</Button>
				<Button
					{@attach disableOnClick(async () => {
						if (
							!selectedPreparationLevel ||
							preparationLevelDescription.length === 0
						) {
							return fancyConfirm(
								'Please fill out all fields',
								'You must fill out the preparation level and description to complete your check in.',
								[['OK', true]],
							);
						}

						await saveCheckIn({
							event: event.event,
							teamId: team.id,
							markAsComplete: true,
							preparationLevel: Number(selectedPreparationLevel) as
								| 1
								| 2
								| 3
								| 4,
							preparationLevelDescription,
						});

						checkInDialogOpen = false;
					})}
					disabled={!selectedPreparationLevel ||
						preparationLevelDescription.length === 0}
				>
					Submit
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
