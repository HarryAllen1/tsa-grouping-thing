<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import * as Tabs from '$lib/components/ui/tabs';
	import { MAX_EVENTS, MIN_POINTS } from '$lib/constants';
	import { totalEventPoints } from '$lib/event-points';
	import { auth, db } from '$lib/firebase';
	import type { EventDoc, UserDoc } from '$lib/types';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { collectionStore, docStore, userStore } from 'sveltefire';
	import EventLine from './EventLine.svelte';

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
				{} as Record<string, boolean>,
			),
	);
	let selectedPoints = $derived(totalEventPoints($userDoc?.events, $events));
	let pointProgress = $derived(
		Math.min(100, (selectedPoints / MIN_POINTS) * 100),
	);
	let pointsRemaining = $derived(Math.max(0, MIN_POINTS - selectedPoints));
	let view = $state<'events' | 'points'>('events');
	let selectableEvents = $derived(
		$events
			.filter((event) => !event.hideInSignup)
			.toSorted((a, b) => a.event.localeCompare(b.event)),
	);
	let eventsByPoints = $derived(
		Array.from({ length: 6 }, (_, index) => {
			const points = 5 - index;
			return {
				points,
				events: selectableEvents.filter((event) => event.points === points),
			};
		}).filter((group) => group.events.length > 0),
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
		Changes are automatically saved.
	</h1>
	<p class="leading-7 not-first:mt-6">
		You may choose up to {MAX_EVENTS} events. You must have at least {MIN_POINTS}
		points. Crossed out events are locked, likely due to eliminations.
	</p>
	<p class="leading-7 not-first:mt-6">
		If you are having trouble choosing events, here are some resources:
	</p>
	<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
		<!-- TODO: Add Links -->
		<!-- <li>
			<a
				target="_blank"
				class="text-primary font-medium underline underline-offset-4"
				href=""
				>Competitive event quiz</a
			>: a form created by the Washington TSA State Officer team to help you
			choose an event
		</li> -->
		<li>
			<a
				target="_blank"
				class="text-primary font-medium underline underline-offset-4"
				href="https://lwsd414.instructure.com/courses/19025/files/folder/Event%20Guides/Event%20Guides%2026-27"
				>Event guides</a
			>: detailed rules and rubrics for each event. MUST READ.
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
	<Tabs.Root bind:value={view} class="gap-4">
		<Tabs.List aria-label="Event list view">
			<Tabs.Trigger value="events">Event view</Tabs.Trigger>
			<Tabs.Trigger value="points">Points view</Tabs.Trigger>
		</Tabs.List>
		<section
			aria-labelledby="point-progress-heading"
			class="bg-card/95 border-border sticky top-3 z-10 mb-6 rounded-xl border p-4 shadow-sm"
		>
			<div class="mb-3 flex items-center justify-between gap-3">
				<div>
					<h2 class="text-foreground text-md font-semibold">
						{#if pointsRemaining > 0}
							{pointsRemaining} more point{pointsRemaining === 1 ? '' : 's'} needed
						{:else}
							Minimum requirement met
						{/if}
					</h2>
				</div>
				<Badge variant={pointsRemaining > 0 ? 'secondary' : 'default'}>
					{selectedPoints} / {MIN_POINTS}
				</Badge>
			</div>
			<Progress
				value={pointProgress}
				aria-label="{selectedPoints} of {MIN_POINTS} event points"
			/>
		</section>

		{#if ($userDoc?.events.length ?? 1) >= MAX_EVENTS && !$userDoc?.eventsLocked}
			<p class="mb-4">
				Remove one or more events if you want to change your events.
			</p>
		{/if}

		<Tabs.Content value="events" class="mb-4">
			<div class="flex flex-col gap-1">
				{#each selectableEvents as event (event.event)}
					<EventLine {event} {eventMap} />
				{/each}
			</div>
		</Tabs.Content>
		<Tabs.Content value="points" class="mb-4">
			<div class="flex flex-col gap-5">
				{#each eventsByPoints as group (group.points)}
					<section aria-labelledby="points-{group.points}">
						<div class="mb-1 flex items-center gap-2 px-3">
							<h2 id="points-{group.points}" class="text-sm font-semibold">
								{group.points} point{group.points === 1 ? '' : 's'}
							</h2>
							<Badge variant="secondary">{group.events.length} events</Badge>
						</div>
						<div class="flex flex-col gap-1">
							{#each group.events as event (event.event)}
								<EventLine {event} {eventMap} />
							{/each}
						</div>
					</section>
				{/each}
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
