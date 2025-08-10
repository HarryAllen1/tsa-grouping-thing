<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
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
</script>

<div class="flex items-center space-x-2">
	{#key updater}
		<Checkbox
			checked={eventMap[event.event]}
			{disabled}
			id={event.event}
			class="flex size-6 items-center justify-center [&_svg]:size-6"
			onCheckedChange={(state) => {
				toast.promise(
					(async (state) => {
						if (
							!state &&
							event.maxTeamSize > 1 &&
							event.teams.some((team) =>
								team.members.some(
									(member) =>
										member.email.toLowerCase() === $user?.email?.toLowerCase(),
								),
							)
						) {
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

						if (
							event.locked ||
							(!eventMap[event.event] &&
								($userDoc?.events.length ?? 0) >= MAX_EVENTS)
						) {
							updater++;
							return;
						}

						const membersTeam = event.teams.find((t) =>
							t.members.some((member) => member.email === $userDoc.email),
						);
						if (
							event.maxTeamSize === 1 &&
							((event.teamCreationLocked &&
								event.teams.length < event.perChapter) ||
								!event.teamCreationLocked)
						) {
							if (state && !membersTeam) {
								await createTeam({
									event: event.event,
								}).catch(toast.error);
							} else if (!state && membersTeam) {
								await leaveTeam({
									event: event.event,
									teamId: membersTeam.id,
								}).catch(toast.error);
							}
						}
						await updateDoc(doc(db, 'users', $user?.email ?? ''), {
							events: eventMap[event.event]
								? ($userDoc?.events.filter((e) => e !== event.event) ?? [])
								: [...($userDoc?.events ?? []), event.event],
							lastUpdated: Timestamp.now(),
							lastUpdatedBy: $user?.email ?? '',
						});
					})(state),
					{
						loading: `${state ? 'Joining' : 'Leaving'} event...`,
						success: `Successfully ${state ? 'joined' : 'left'} event`,
						error: `An error occurred whilst ${state ? 'joining' : 'leaving'} the event.`,
					},
				);
			}}
		/>
		<Label
			for={event.event}
			class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 {disabled
				? 'opacity-50'
				: ''} {event.locked ? 'line-through' : ''}"
		>
			<span class="ml-2">{event.event}</span>
		</Label>
		{#if event.locked}
			<Lock />
		{/if}
	{/key}
</div>
