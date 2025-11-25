<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { MAX_EVENTS, MIN_EVENTS } from '$lib/constants';
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
		 This link is outdated...
			<a
				target="_blank"
				class="text-primary font-medium underline underline-offset-4"
				href="https://lwsd414.instructure.com/courses/19025/files/folder/Event%20Guides%2025-26"
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
		<!-- <li>
		 This site must be updated before it can be included...
			<a
				target="_blank"
				class="text-primary font-medium underline underline-offset-4"
				href="https://jhstsa.org">JHS TSA website</a
			>: quick facts about each event
		</li> -->
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
		{#each $events
			.filter((e) => !e.hideInSignup)
			.toSorted( (a, b) => a.event.localeCompare(b.event), ) as event (event.event)}
			<EventLine {event} {eventMap} />
		{/each}
	</div>
</div>
