<script lang="ts">
	import { page } from '$app/stores';
	import {
		allUsersCollection,
		auth,
		db,
		eventsCollection,
		settings,
		type EventData,
	} from '$lib';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Switch } from '$lib/components/ui/switch';
	import { doc, setDoc } from 'firebase/firestore';
	import Fuse from 'fuse.js';
	import { userStore } from 'sveltefire';
	import EventCard from './EventCard.svelte';
	import Alert from './Alert.svelte';

	const user = userStore(auth);

	let search = decodeURIComponent($page.url.searchParams.get('q') ?? '');

	const changeSearch = (s: string) => (search = s);

	let eventData: EventData[] = [];
	$: eventData = $eventsCollection.length
		? $eventsCollection
				.map((e) => {
					const allMembers =
						$allUsersCollection?.filter((m) => m.events.includes(e.event)) ??
						[];
					return {
						...e,
						members: allMembers.map((m) => ({
							name: m.name,
							email: m.email,
						})),
						teamNumbers: e.teams.map((t) => `2082-${t.teamNumber}`),
						waId: allMembers.map((m) => m.washingtonId).filter((m) => m),
					};
				})
				.sort((a, b) => a.event.localeCompare(b.event))
		: [];

	let shouldHideIndividualEvents = false;
	let onlyShowOverflown = false;

	const fuseKeys = {
		event: true,
		members: true,
		waId: true,
		teamNumbers: true,
	};
	let threshold = 0.2;
	$: fuse = new Fuse(
		eventData.map((e) => ({ ...e, members: e.members.map((m) => m.name) })),
		{
			keys: Object.entries(fuseKeys)
				.filter(([, value]) => value)
				.map(([key]) => key),
			threshold,
		},
	);
	$: signedUpEvents = eventData;
	$: eventResults =
		search === ''
			? eventData.map((r) => r.event)
			: fuse.search(search).map((r) => r.item.event);

	const newEventStuff = {
		event: '',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 1,
		locked: false,
	};

	let newEventDialogOpen = false;
</script>

<svelte:window
	on:keydown={(e) => {
		const el = document.querySelector('#search');
		if (
			e.key === '/' &&
			el !== document.activeElement &&
			!(document.activeElement instanceof HTMLInputElement) &&
			!(document.activeElement instanceof HTMLTextAreaElement)
		) {
			if (el instanceof HTMLInputElement) {
				el.focus();
				e.preventDefault();
			}
		}
	}}
/>

<div class="container mt-8 flex flex-col items-center">
	<h1 class="my-4 mb-6 text-3xl font-bold">
		Please don't add yourself to events that you aren't in!
	</h1>
	<div class="mb-4 flex w-full flex-col gap-4 md:flex-row">
		<Label class="flex flex-row items-center">
			<Switch class="mr-2" bind:checked={fuseKeys.event} />
			Search by events
		</Label>
		<Label class="flex flex-row items-center">
			<Switch class="mr-2" bind:checked={fuseKeys.members} />
			Search by members
		</Label>
		<Label class="flex flex-row items-center">
			<Switch class="mr-2" bind:checked={shouldHideIndividualEvents} />
			Hide individual events
		</Label>
		<Label class="flex flex-row items-center">
			<Switch class="mr-2" bind:checked={onlyShowOverflown} />
			Only show overflown events
		</Label>
	</div>
	<Input
		class="mb-4"
		bind:value={search}
		type="search"
		id="search"
		placeholder="Search"
	/>

	<p class="mb-2 w-full">Green team: full; red team: over or underfilled</p>
	<div class="mb-4 w-full space-y-2">
		<Dialog.Root bind:open={newEventDialogOpen}>
			<Dialog.Trigger class={buttonVariants()}>Create new event</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Title>Create new event</Dialog.Title>
				<form
					class="flex flex-col gap-4"
					on:submit|preventDefault={async () => {
						newEventStuff.maxTeamSize = Number(newEventStuff.maxTeamSize);
						newEventStuff.minTeamSize = Number(newEventStuff.minTeamSize);
						await setDoc(doc(db, 'events', newEventStuff.event), {
							...newEventStuff,
							teams: [],
							lastUpdatedBy: $user?.email ?? '',
						});
						newEventDialogOpen = false;
					}}
				>
					<Label class="flex w-full max-w-sm flex-col gap-1.5">
						<span>Event name</span>
						<Input
							bind:value={newEventStuff.event}
							placeholder="really cool event name"
						/>
					</Label>
					<Label class="flex w-full max-w-sm flex-col gap-1.5">
						<span>Minimum team size</span>
						<Input
							bind:value={newEventStuff.minTeamSize}
							type="number"
							placeholder="1"
						/>
					</Label>
					<Label class="flex w-full max-w-sm flex-col gap-1.5">
						<span>Maximum team size</span>
						<Input
							bind:value={newEventStuff.maxTeamSize}
							type="number"
							placeholder="1"
						/>
					</Label>
					<Label class="flex w-full max-w-sm flex-col gap-1.5">
						<span>Maximum teams per chapter</span>
						<Input
							bind:value={newEventStuff.perChapter}
							type="number"
							placeholder="1"
						/>
					</Label>
					<div class="flex items-center space-x-2">
						<Checkbox id="newEventLocked" bind:checked={newEventStuff.locked} />
						<Label for="newEventLocked" class="text-foreground">Lock</Label>
					</div>
					<div>
						<Button type="submit">Create</Button>
					</div>
				</form>
			</Dialog.Content>
		</Dialog.Root>
		<div class="flex items-center space-x-2">
			<Button
				on:click={() => {
					for (const event of signedUpEvents) {
						setDoc(
							doc(db, 'events', event.event ?? ''),
							{
								teamCreationLocked: true,
								lastUpdatedBy: $user?.email ?? '',
							},
							{
								merge: true,
							},
						);
					}
				}}
			>
				Disable all team creation
			</Button>
		</div>
		<div class="flex items-center space-x-2">
			<Alert />
		</div>
		<div class="flex items-center space-x-2">
			<Switch
				id="enable-online-submissions"
				checked={$settings?.enableOnlineSubmissions ?? false}
				onCheckedChange={async (e) => {
					await setDoc(
						doc(db, 'settings', 'settings'),
						{
							enableOnlineSubmissions: e,
							lastUpdatedBy: $user?.email ?? '',
						},
						{ merge: true },
					);
				}}
			/>
			<Label for="enable-online-submissions">Enable online submissions</Label>
		</div>
	</div>
	<div
		class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:items-start xl:grid-cols-3"
	>
		{#each signedUpEvents ?? [] as event (event.event)}
			{#if !shouldHideIndividualEvents || (shouldHideIndividualEvents && event.maxTeamSize > 1)}
				<EventCard
					{event}
					{eventData}
					{changeSearch}
					hidden={!eventResults.includes(event.event) ||
						(onlyShowOverflown && event.teams.length <= event.perChapter)}
				/>
			{/if}
		{:else}
			<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
			{#each { length: 9 } as _}
				<Skeleton class="h-[32rem] w-full" />
			{/each}
		{/each}
	</div>
</div>
