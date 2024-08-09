<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, db, yay, sleep, type EventDoc, type UserDoc } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { Timestamp, doc, setDoc } from 'firebase/firestore';
	import { Lock } from 'lucide-svelte';
	import { collectionStore, docStore, userStore } from 'sveltefire';

	let {
		page = $bindable(),
	}: {
		page: number;
	} = $props();

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

<h1
	class="mb-6 mt-8 w-full scroll-m-20 text-start text-4xl font-extrabold tracking-tight lg:text-5xl"
>
	Choose Events
</h1>
<p class="leading-7 [&:not(:first-child)]:mt-6">
	You may choose up to 6 events. You must have at at least 4 events. If an event
	is red, teams can no longer be created for that event. Crossed out events are
	locked, likely due to eliminations.
</p>
<p class="leading-7 [&:not(:first-child)]:mt-6">
	If you are having trouble choosing events, here are some resources:
</p>
<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
	<li>
		<a
			target="_blank"
			class="font-medium text-primary underline underline-offset-4"
			href="https://qz.app.do/what-tsa-events-are-for-me"
			>Competitive event quiz</a
		>: a form created by the Washington TSA State Officer team to help you
		choose an event
	</li>
	<li>
		<a
			target="_blank"
			class="font-medium text-primary underline underline-offset-4"
			href="https://lwsd.sharepoint.com/:f:/r/sites/GR-JHS-TechnologyStudentAssociation-SCA/Shared%20Documents/23-24/Competition/Event%20Guides?csf=1&web=1&e=ctur4B"
			>Event guides</a
		>: detailed rules and rubrics for each event
	</li>
	<li>
		<a
			target="_blank"
			class="font-medium text-primary underline underline-offset-4"
			href="https://www.washingtontsa.org/high-school-events"
			>Washington TSA website</a
		>: Washington-specific guidelines for each event as well as previous year's
		event entries
	</li>
	<li>
		<a
			target="_blank"
			class="font-medium text-primary underline underline-offset-4"
			href="https://jhstsa.org">JHS TSA website</a
		>: quick facts about each event
	</li>
</ul>

{#if ($userDoc?.events.length ?? 1) >= 6}
	<p class="mb-4">
		Remove one or more events if you want to change your events.
	</p>
{/if}

<div class="mb-4 flex flex-col gap-2">
	{#each $events.filter((e) => !e.hideInSignup) as event (event.event)}
		<div
			class="flex items-center space-x-2"
			class:text-red-500={event.teams.length >= event.perChapter}
		>
			<Checkbox
				checked={eventMap[event.event]}
				disabled={event.locked ||
					(!eventMap[event.event] && ($userDoc?.events.length ?? 0) >= 6) ||
					!$userDoc?.events}
				id={event.event}
				class="flex h-6 w-6 items-center justify-center [&>div]:h-6 [&>div]:w-6"
				onCheckedChange={async () => {
					if (
						event.locked ||
						(!eventMap[event.event] && ($userDoc?.events.length ?? 0) >= 6)
					)
						return;

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
				class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 {event.locked ||
				(!eventMap[event.event] && ($userDoc?.events.length ?? 0) >= 6)
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

<div class="mb-4 flex w-full flex-row justify-between">
	<Button
		on:click={() => {
			page--;
		}}
		variant="outline">Back</Button
	>
	<Button
		on:click={async () => {
			await setDoc(
				doc(db, 'users', $user?.email ?? ''),
				{
					lastUpdated: new Timestamp(Date.now() / 1000, 0),
					lastUpdatedBy: $user?.email ?? '',
					completedIntakeForm: true,
				},
				{
					merge: true,
				},
			);
			yay.play();
			await sleep(300);
			await goto('/');
		}}
	>
		Finish
	</Button>
</div>
