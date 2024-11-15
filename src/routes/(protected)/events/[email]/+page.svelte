<script lang="ts">
	import { page } from '$app/stores';
	import {
		auth,
		db,
		MAX_EVENTS,
		MIN_EVENTS,
		type EventDoc,
		type UserDoc,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { doc, setDoc, Timestamp } from 'firebase/firestore';
	import Lock from 'lucide-svelte/icons/lock';
	import { derived as derivedStore } from 'svelte/store';
	import { collectionStore, docStore, userStore } from 'sveltefire';

	const actualUser = userStore(auth);
	const user = derivedStore(actualUser, ($u) => ({
		...$u,
		email: decodeURIComponent($page.params.email),
	}));

	const userDoc = docStore<UserDoc>(db, `users/${$user.email}`);
	const events = collectionStore<EventDoc>(db, 'events');

	let eventMap = $derived(
		$events
			.filter((e) => e.event !== '*Rooming')
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
	<title>Admin Account Management — JHS TSA Teaming</title>
</svelte:head>

<div class="container mt-6">
	<h1
		class="mb-4 mt-4 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		Crossed out events are locked, likely due to eliminations.
	</h1>
	<Button href="/account/{$userDoc?.email}">Modify intake form</Button>
	<p class="mb-2">Minimum {MIN_EVENTS} events, maximum {MAX_EVENTS} events.</p>
	<p class="mb-4">Currently {$userDoc?.events.length}/{MAX_EVENTS}</p>

	<div class="mb-4 flex flex-col gap-2">
		{#each $events.filter((e) => e.event !== '*Rooming') as event (event.event)}
			<div class="flex items-center space-x-2">
				<Checkbox
					checked={eventMap[event.event]}
					id={event.event}
					class="flex h-6 w-6 items-center justify-center [&>div]:h-6 [&>div]:w-6"
					onCheckedChange={async () => {
						await setDoc(
							doc(db, 'users', $user?.email ?? ''),
							{
								events: eventMap[event.event]
									? ($userDoc?.events.filter((e) => e !== event.event) ?? [])
									: [...($userDoc?.events ?? []), event.event],
								lastUpdated: new Timestamp(Date.now() / 1000, 0),
								lastUpdatedBy: $actualUser?.email ?? '',
							},
							{
								merge: true,
							},
						);
					}}
				/>
				<Label
					for={event.event}
					class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 {event.locked
						? 'line-through'
						: ''}"
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
