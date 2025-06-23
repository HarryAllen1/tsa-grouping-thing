<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { MAX_EVENTS, MIN_EVENTS } from '$lib/constants';
	import { auth, db } from '$lib/firebase';
	import type { EventDoc, UserDoc } from '$lib/types';
	import { Timestamp, doc, setDoc } from 'firebase/firestore';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Lock from '@lucide/svelte/icons/lock';
	import { collectionStore, docStore, userStore } from 'sveltefire';

	const user = userStore(auth);

	const userDoc = docStore<UserDoc>(db, `users/${$user?.email}`);
	const events = collectionStore<EventDoc>(db, 'events');

	let eventMap = $derived(
		$events
			.filter((e) => !e.hideInSignup)
			.reduce(
				(acc, curr) => {
					acc[curr.event] = $userDoc?.events.includes(curr.event) ?? false;
					return acc;
				},
				{} as { [event: string]: boolean },
			),
	);
</script>

<svelte:head>
	<title>Edit Events — JHS TSA Teaming</title>
</svelte:head>

<div class="container">
	<h1
		class="mt-8 mb-6 w-full scroll-m-20 text-start text-4xl font-extrabold tracking-tight lg:text-5xl"
	>
		Edit Events
	</h1>
	{#if $userDoc?.eventsLocked}
		<Alert.Root variant="destructive" class="mb-4">
			<CircleAlert class="size-4" />
			<Alert.Title>Events Locked</Alert.Title>
			<Alert.Description>
				Your events are currently locked. This is likely because some deadline
				or event is approaching, you were eliminated from TSA, or you left TSA.
				If this seems like a mistake, please contact a JHS TSA Board Member.
			</Alert.Description>
		</Alert.Root>
	{/if}
	<h1
		class="mt-4 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		Changes will automatically be saved. Try to leave any teams for events you
		are dropping.
	</h1>
	<p class="leading-7 not-first:mt-6">
		You may choose up to {MAX_EVENTS} events. You must have at at least {MIN_EVENTS}
		events. Crossed out events are locked, likely due to eliminations.
	</p>
	<p class="leading-7 not-first:mt-6">
		If you are having trouble choosing events, here are some resources:
	</p>
	<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
		<li>
			<a
				target="_blank"
				class="text-primary font-medium underline underline-offset-4"
				href="https://qz.app.do/what-tsa-events-are-for-me"
				>Competitive event quiz</a
			>: a form created by the Washington TSA State Officer team to help you
			choose an event
		</li>
		<li>
			<a
				target="_blank"
				class="text-primary font-medium underline underline-offset-4"
				href="https://lwsd.sharepoint.com/:f:/r/sites/GR-JHS-TechnologyStudentAssociation-SCA/Shared%20Documents/2024-25/Event%20Guides?csf=1&web=1&e=5PsOsB"
				>Event guides</a
			>: detailed rules and rubrics for each event
		</li>
		<li>
			<a
				target="_blank"
				class="text-primary font-medium underline underline-offset-4"
				href="https://www.washingtontsa.org/high-school-events"
				>Washington TSA website</a
			>: Washington-specific guidelines for each event as well as previous
			year's event entries
		</li>
		<li>
			<a
				target="_blank"
				class="text-primary font-medium underline underline-offset-4"
				href="https://jhstsa.org">JHS TSA website</a
			>: quick facts about each event
		</li>
	</ul>
	<p class="mb-4">
		Currently at {$userDoc?.events.length} out of a maximum of {MAX_EVENTS} events.
		The minimum number of events is
		{MIN_EVENTS}.
	</p>

	{#if ($userDoc?.events.length ?? 1) >= MAX_EVENTS && !$userDoc?.eventsLocked}
		<p class="mb-4">
			Remove one or more events if you want to change your events.
		</p>
	{/if}

	<div class="mb-4 flex flex-col gap-2">
		{#each $events.filter((e) => !e.hideInSignup) as event (event.event)}
			{@const disabled =
				$userDoc?.eventsLocked ||
				event.locked ||
				(!eventMap[event.event] &&
					($userDoc?.events.length ?? 0) >= MAX_EVENTS) ||
				(event.teamCreationLocked &&
					event.maxTeamSize === 1 &&
					event.teams.length >= event.perChapter) ||
				(event.teamCreationLocked &&
					event.teams.reduce((acc, curr) => acc + curr.members.length, 0) >=
						event.perChapter * event.maxTeamSize)}
			<div class="flex items-center space-x-2">
				<Checkbox
					checked={eventMap[event.event]}
					{disabled}
					id={event.event}
					class="flex size-6 items-center justify-center [&_svg]:size-6"
					onCheckedChange={async (state) => {
						if (
							event.locked ||
							(!eventMap[event.event] &&
								($userDoc?.events.length ?? 0) >= MAX_EVENTS)
						)
							return;

						const membersTeam = event.teams.find((t) =>
							t.members
								.map((m) => m.email)
								.includes($user?.email?.toLowerCase() ?? ''),
						);
						if (
							event.maxTeamSize === 1 &&
							((event.teamCreationLocked &&
								event.teams.length < event.perChapter) ||
								!event.teamCreationLocked)
						) {
							if (state && !membersTeam) {
								let lowestNotTaken = 1;
								while (
									event.teams.some((t) => t.teamNumber === lowestNotTaken)
								) {
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
							} else if (!state && membersTeam) {
								membersTeam.members.splice(
									membersTeam.members.findIndex(
										(e) => e.email.toLowerCase() === ($user?.email ?? ''),
									),
									1,
								);
							}
							await setDoc(
								doc(db, 'events', event.event),
								{
									teams: event.teams.filter((t) => t.members.length > 0),
									lastUpdated: new Timestamp(Date.now() / 1000, 0),
									lastUpdatedBy: $user?.email ?? '',
								},
								{
									merge: true,
								},
							);
						}
						await setDoc(
							doc(db, 'users', $user?.email ?? ''),
							{
								events: eventMap[event.event]
									? ($userDoc?.events.filter((e) => e !== event.event) ?? [])
									: [...($userDoc?.events ?? []), event.event],
								lastUpdated: new Timestamp(Date.now() / 1000, 0),
								lastUpdatedBy: $user?.email ?? '',
							},
							{
								merge: true,
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
			</div>
		{/each}
	</div>
</div>
