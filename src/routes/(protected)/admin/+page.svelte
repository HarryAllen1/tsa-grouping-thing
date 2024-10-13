<script lang="ts">
	import { page } from '$app/stores';
	import {
		allUsersCollection,
		auth,
		db,
		eventsCollection,
		fancyConfirm,
		sleep,
		type EventData,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Switch } from '$lib/components/ui/switch';
	import {
		collection,
		deleteField,
		doc,
		getDocs,
		setDoc,
	} from 'firebase/firestore';
	import Fuse from 'fuse.js';
	import Filter from 'lucide-svelte/icons/filter';
	import { userStore } from 'sveltefire';
	import { downloadAsJSON } from '../../download';
	import Alert from './Alert.svelte';
	import EventCard from './EventCard.svelte';

	const user = userStore(auth);

	let search = $state(
		decodeURIComponent($page.url.searchParams.get('q') ?? ''),
	);

	const changeSearch = (s: string) => {
		search = s;
	};

	let eventData = $derived<EventData[]>(
		$eventsCollection
			.map((e) => {
				const allMembers =
					$allUsersCollection?.filter((m) => m.events.includes(e.event)) ?? [];
				return {
					...e,
					members: allMembers.map((m) => ({
						name: m.name,
						email: m.email,
					})),
					teamNumbers: e.teams.map((t) => `2082-${t.teamNumber}`),
					waId: allMembers.map((m) => m.washingtonId).filter(Boolean),
				};
			})
			.toSorted((a, b) => a.event.localeCompare(b.event)),
	);

	let shouldHideIndividualEvents = $state(false);
	let onlyShowOverflown = $state(false);

	const fuseKeys = {
		event: true,
		members: true,
		waId: true,
		teamNumbers: true,
	};
	let threshold = 0.2;
	let fuse = $derived(
		new Fuse(
			eventData.map((e) => ({ ...e, members: e.members.map((m) => m.name) })),
			{
				keys: Object.entries(fuseKeys)
					.filter(([, value]) => value)
					.map(([key]) => key),
				threshold,
			},
		),
	);
	let eventResults = $derived(
		search === ''
			? eventData.map((r) => r.event)
			: fuse.search(search).map((r) => r.item.event),
	);

	const newEventStuff: {
		event: string;
		minTeamSize: number;
		maxTeamSize: number;
		perChapter: number;
		locked: boolean | 'indeterminate' | undefined;
	} = {
		event: '',
		minTeamSize: 1,
		maxTeamSize: 1,
		perChapter: 1,
		locked: false,
	};

	let newEventDialogOpen = $state(false);
</script>

<svelte:head>
	<title>Admin Team Management — JHS TSA Teaming</title>
</svelte:head>

<svelte:window
	on:keydown={(e) => {
		const el = document.querySelector('#search');
		if (
			e.key === '/' &&
			el !== document.activeElement &&
			!(document.activeElement instanceof HTMLInputElement) &&
			!(document.activeElement instanceof HTMLTextAreaElement) &&
			el instanceof HTMLInputElement
		) {
			el.focus();
			e.preventDefault();
		}
	}}
/>

<div class="container my-8 flex flex-col">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
		Team Management
	</h1>
	<p class="my-4 text-red-500">
		Please do not add yourself to events you are not signed up for
	</p>

	<div class="flex flex-row gap-2">
		<Input bind:value={search} type="search" id="search" placeholder="Search" />
		<Popover.Root>
			<Popover.Trigger>
				<Button variant="outline" size="icon"><Filter></Filter></Button>
			</Popover.Trigger>
			<Popover.Content class="flex flex-col gap-2">
				<div>
					<Label class="flex flex-row items-center">
						<Switch class="mr-2" bind:checked={fuseKeys.event} />
						Search by events
					</Label>
				</div>
				<div>
					<Label class="flex flex-row items-center">
						<Switch class="mr-2" bind:checked={fuseKeys.members} />
						Search by members
					</Label>
				</div>
				<div>
					<Label class="flex flex-row items-center">
						<Switch class="mr-2" bind:checked={shouldHideIndividualEvents} />
						Hide individual events
					</Label>
				</div>
				<div>
					<Label class="flex flex-row items-center">
						<Switch class="mr-2" bind:checked={onlyShowOverflown} />
						Only show overflown events
					</Label>
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>

	<p class="mb-2 w-full">Green team: full; red team: over or underfilled</p>
	<div
		class="mb-4 flex flex-col items-start gap-2 lg:flex-row lg:items-center lg:gap-4"
	>
		<Dialog.Root bind:open={newEventDialogOpen}>
			<Dialog.Trigger>
				<Button>Create new event</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Title>Create new event</Dialog.Title>
				<div class="flex flex-col gap-4">
					<Label class="flex w-full flex-col gap-1.5">
						<span>Event name</span>
						<Input
							bind:value={newEventStuff.event}
							placeholder="really cool event name"
						/>
					</Label>
					<Label class="flex w-full flex-col gap-1.5">
						<span>Minimum team size</span>
						<Input
							bind:value={newEventStuff.minTeamSize}
							type="number"
							placeholder="1"
						/>
					</Label>
					<Label class="flex w-full flex-col gap-1.5">
						<span>Maximum team size</span>
						<Input
							bind:value={newEventStuff.maxTeamSize}
							type="number"
							placeholder="1"
						/>
					</Label>
					<Label class="flex w-full flex-col gap-1.5">
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
				</div>
				<Dialog.Footer>
					<Button
						class="mr-2"
						variant="ghost"
						on:click={() => (newEventDialogOpen = false)}
					>
						Cancel
					</Button>
					<Button
						on:click={async (e) => {
							e.preventDefault();
							newEventStuff.maxTeamSize = Number(newEventStuff.maxTeamSize);
							newEventStuff.minTeamSize = Number(newEventStuff.minTeamSize);
							await setDoc(doc(db, 'events', newEventStuff.event), {
								...newEventStuff,
								teams: [],
								lastUpdatedBy: $user?.email ?? '',
							});
							newEventDialogOpen = false;
						}}>Create</Button
					>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
		<Button
			on:click={() => {
				for (const event of eventData) {
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
		<Alert />
		<Button
			variant="destructive"
			on:click={async () => {
				if (
					!(await fancyConfirm(
						'Are you sure you want to reset the system?',
						"This will delete all members without events (excluding admins and advisors), all members' events, all teams (not including the events themselves), all rooms, all results, all statistics, all files (like returned rubrics and submissions), and all messages (including blocked messages).",
					))
				) {
					return;
				}
				await downloadAsJSON();
				await sleep(500);
				if (
					!(await fancyConfirm(
						'This is (almost) irreversable',
						'A backup JSON file has been downloaded in the event that old data needs to be recovered. Once this process is completed, all data will be gone, forever. If anything needs to be restored, email this file to Harry, and some of the data will be restored. It is impossible to restore everything (like any files), so make sure that this is actually intentional.',
					))
				) {
					return;
				}
				const confirmationMessage =
					'I understand that all of this data will be deleted and that most of this data cannot be restored';
				if (
					!prompt(
						`Please type the following message to continue: ${confirmationMessage}`,
					)
						?.toLowerCase()
						?.includes(confirmationMessage.toLowerCase())
				) {
					alert('Incorrect message');
					return;
				}

				for (const member of (await getDocs(collection(db, 'users'))).docs) {
					const data = member.data();
					data.events = [];
					data.washingtonId = deleteField();
					data.completedIntakeForm = false;
					await setDoc(member.ref, data);
				}
				for (const event of (await getDocs(collection(db, 'events'))).docs) {
					const data = event.data();
					if (data.event === '*Rooming') {
						await setDoc(event.ref, {
							...data,
							teams: [],
							results: [],
							allowGenderMixing: false,
							hideInSignup: true,
							showToEveryone: false,
							locked: false,
						});
					}
					await setDoc(event.ref, {
						...data,
						locked: deleteField(),
						teams: [],
						onlineSubmissions: deleteField(),
						teamCreationLocked: deleteField(),
						ref: deleteField(),
					});
				}

				await setDoc(
					doc(db, 'settings', 'settings'),
					{
						enableOnlineSubmissions: false,
						lastUpdatedBy: $user?.email ?? '',
						alert: '',
					},
					{ merge: true },
				);
			}}
		>
			Reset system
		</Button>
	</div>
	<div
		class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:items-start xl:grid-cols-3"
	>
		{#each eventData ?? [] as event (event.event)}
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
