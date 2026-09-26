<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { MAX_EVENTS } from '$lib/constants';
	import { fancyConfirm } from '$lib/FancyConfirm.svelte';
	import { db } from '$lib/firebase';
	import { createTeam, leaveTeam } from '$lib/functions';
	import { user, userDoc } from '$lib/stores';
	import type { EventDoc } from '$lib/types';
	import Lock from '@lucide/svelte/icons/lock';
	import { doc, Timestamp, updateDoc } from 'firebase/firestore';
	import { toast } from 'svelte-sonner';

	let {
		event,
		eventMap,
	}: { event: EventDoc; eventMap: Record<string, boolean> } = $props();

	let updater = $state(0);
	let optimisticChecked = $state<boolean | null>(null);
	let isSaving = $state(false);
	let checked = $derived(optimisticChecked ?? eventMap[event.event]);
	let disabled = $derived(
		// user's events are locked by admin
		$userDoc?.eventsLocked ||
			// event is locked
			event.locked ||
			// user is not signed up for event and has reached max events
			(!eventMap[event.event] &&
				($userDoc?.events.length ?? 0) >= MAX_EVENTS) ||
			// team creation is locked and it's an individual event which is full
			(event.teamCreationLocked &&
				event.maxTeamSize === 1 &&
				event.teams.length >= event.perChapter) ||
			// team creation is locked and it's a fully saturated event
			(event.teamCreationLocked &&
				event.teams.reduce((acc, curr) => acc + curr.members.length, 0) >=
					event.perChapter * event.maxTeamSize) ||
			// the team the user is in is locked
			(eventMap[event.event] &&
				event.teams.find((t) =>
					t.members.some(
						(u) => u.email.toLowerCase() === $user?.email?.toLowerCase(),
					),
				)?.locked),
	);

	$effect(() => {
		if (!isSaving && optimisticChecked === eventMap[event.event]) {
			optimisticChecked = null;
		}
	});

	const updateEventSelection = async (state: boolean) => {
		const previousState = eventMap[event.event];
		const membersTeam = event.teams.find((t) =>
			t.members.some((member) => member.email === $userDoc.email),
		);

		optimisticChecked = state;
		isSaving = true;

		try {
			if (
				event.locked ||
				(!eventMap[event.event] && ($userDoc?.events.length ?? 0) >= MAX_EVENTS)
			) {
				throw new Error('This event can no longer be changed.');
			}

			if (event.maxTeamSize === 1) {
				if (state && !membersTeam) {
					await createTeam({ event: event.event });
				} else if (!state && membersTeam) {
					await leaveTeam({
						event: event.event,
						teamId: membersTeam.id,
					});
				}
			}

			await updateDoc(doc(db, 'users', $user?.email ?? ''), {
				events: previousState
					? ($userDoc?.events.filter((e) => e !== event.event) ?? [])
					: [...($userDoc?.events ?? []), event.event],
				lastUpdated: Timestamp.now(),
				lastUpdatedBy: $user?.email ?? '',
			});
		} catch (error) {
			optimisticChecked = previousState;
			throw error;
		} finally {
			isSaving = false;
		}
	};

	const handleCheckedChange = async (state: boolean) => {
		const membersTeam = event.teams.find((t) =>
			t.members.some((member) => member.email === $userDoc.email),
		);

		if (!state && event.maxTeamSize > 1 && membersTeam) {
			const result = await fancyConfirm(
				'You are still in a team!',
				'Are you sure you want to leave this event? You will be removed from your team and will be unable to rejoin it unless added by a team member.',
				[
					['No, stay', false],
					['Yes, leave', true],
				],
			);

			if (!result) {
				updater++;
				return;
			}
		}

		toast.promise(updateEventSelection(state), {
			loading: `${state ? 'Joining' : 'Leaving'} event...`,
			success: `Successfully ${state ? 'joined' : 'left'} event`,
			error: (error) =>
				error instanceof Error
					? error.message
					: `An error occurred whilst ${state ? 'joining' : 'leaving'} the event.`,
		});
	};
</script>

<div
	class="hover:bg-accent/60 flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
>
	{#key updater}
		<Checkbox
			{checked}
			disabled={disabled || isSaving}
			id={event.event}
			class="flex size-6 items-center justify-center [&_svg]:size-6"
			onCheckedChange={handleCheckedChange}
		/>
		<div class="flex min-w-0 items-center gap-2">
			<Label
				for={event.event}
				class="truncate text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 {disabled
					? 'opacity-50'
					: ''} {event.locked ? 'line-through' : ''}"
			>
				<span>{event.event}</span>
			</Label>
			<Badge variant="secondary">{event.points}</Badge>
		</div>
		{#if event.locked}
			<Lock />
		{/if}
	{/key}
</div>
