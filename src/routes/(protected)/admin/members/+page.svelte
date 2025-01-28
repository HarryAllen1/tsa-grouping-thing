<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import { MIN_EVENTS } from '$lib/constants';
	import { fancyConfirm } from '$lib/FancyConfirm.svelte';
	import { db } from '$lib/firebase';
	import { allUsersCollection, settings } from '$lib/stores';
	import type { UserDoc } from '$lib/types';
	import { csvFormat } from 'd3';
	import {
		collection,
		deleteDoc,
		deleteField,
		getDocs,
		setDoc,
	} from 'firebase/firestore';
	import Fuse from 'fuse.js';
	import CircleHelp from 'lucide-svelte/icons/circle-help';
	import Download from 'lucide-svelte/icons/download';
	import CopyButton from './CopyButton.svelte';
	import MemberGridCard from './MemberGridCard.svelte';
	import TableView from './TableView.svelte';

	let search = $state('');
	let hidePeopleWithoutEvents = $state(false);
	let sortBy = $state<'firstName' | 'lastName'>('firstName');
	let view = $state('grid');
	let showRandomSwitch = $state<'null' | 'false' | 'true'>('null');
	// max number of events is always 6
	let numberOfEvents = $state<('0' | '1' | '2' | '3' | '4' | '5' | '6')[]>([
		'0',
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
	]);

	let fuse = $derived(
		new Fuse($allUsersCollection, {
			keys: ['name', 'email', 'grade', 'events', 'nationalId', 'washingtonId'],
			threshold: 0.2,
		}),
	);
	let resultsPreNumEventsFilter = $derived(
		search === ''
			? $allUsersCollection
					.toSorted((a, b) => a.name.localeCompare(b.name))
					.filter((u) => !hidePeopleWithoutEvents || u.events.length > 0)
			: fuse.search(search).map((r) => r.item),
	);
	let results = $derived(
		numberOfEvents.length === 6
			? resultsPreNumEventsFilter
			: resultsPreNumEventsFilter.filter((u) =>
					numberOfEvents.includes(
						u.events.length.toString() as
							| '0'
							| '1'
							| '2'
							| '3'
							| '4'
							| '5'
							| '6',
					),
				),
	);
</script>

<svelte:head>
	<title>Admin Member Management — JHS TSA Teaming</title>
</svelte:head>

<div class="container pb-4">
	<h1
		class="my-4 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
	>
		Members
	</h1>

	<div class="flex flex-row gap-2">
		<Button
			class="mb-4"
			onclick={() => {
				for (const el of document.querySelectorAll(
					'.member-collapsible:not([data-state="open"])',
				) as unknown as HTMLElement[]) {
					if (el instanceof HTMLButtonElement) el.click();
				}
			}}
		>
			Expand all events
		</Button>

		<CopyButton />
		<Button
			size="icon"
			onclick={() => {
				alert(
					'Make sure to go look at this file in Excel and ensure that all information is correct and remove any unnecessary rows before submitting.',
				);
				const csv = csvFormat(
					$allUsersCollection
						.filter((u) => u.events.length > 0 && u.completedIntakeForm)
						.map((u) => ({
							'First Name':
								(u.preferredFirstName || u.firstName) ?? u.name.split(' ')[0],
							'Last Name': u.lastName ?? u.name.split(' ').slice(1).join(' '),
							Grade: u.grade,
							Demographic: u.demographic ?? 'Opt-out',
							Gender: u.gender,
							'Member Type': 'Member',
						})),
				);

				const blob = new Blob([csv], { type: 'text/csv' });
				const url = URL.createObjectURL(blob);

				const a = document.createElement('a');
				a.href = url;
				a.download = 'members.csv';
				a.click();

				URL.revokeObjectURL(url);
			}}
		>
			<Download />
		</Button>
		<Button
			variant="destructive"
			onclick={async () => {
				if (
					!(await fancyConfirm(
						'Are you sure you want to do this?',
						"This will delete all seniors and increase everyone's grade level by one. It will also reset the random switch.",
					))
				) {
					return;
				}
				if (
					!prompt('Type "graduate" to confirm')
						?.toLowerCase()
						.includes('graduate')
				) {
					return;
				}

				for (const member of (await getDocs(collection(db, 'users'))).docs) {
					const data = member.data() as UserDoc;
					await (data.grade === 12
						? deleteDoc(member.ref)
						: setDoc(
								member.ref,
								{
									grade: (data.grade ?? 9) + 1,
									random: false,
									events: [],
									washingtonId: deleteField(),
								},
								{
									merge: true,
								},
							));
				}
			}}
		>
			Graduate
		</Button>
	</div>

	<div class="mb-2 flex items-center space-x-2">
		<Switch bind:checked={hidePeopleWithoutEvents} id="hide-people" />
		<Label for="hide-people">Hide people without events</Label>
	</div>
	<div class="mb-2 flex items-center space-x-2">
		{#if $settings}
			<Switch
				checked={$settings!.lockAccounts}
				onCheckedChange={async (state) => {
					await setDoc(settings.ref!, { lockAccounts: state }, { merge: true });
				}}
				id="lock-account"
			/>
		{/if}
		<div class="flex flex-row items-center gap-1">
			<Label for="lock-account">Lock all accounts</Label>
			<Popover.Root>
				<Popover.Trigger>
					<CircleHelp class="size-5" />
				</Popover.Trigger>
				<Popover.Content>
					Prevents all members from editing their account information (name,
					gender, etc.)
				</Popover.Content>
			</Popover.Root>
		</div>
	</div>
	<div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
		<div>
			<Label for="sortBy">Sort by</Label>
			<div id="sortBy" class="mb-2 flex items-center space-x-2">
				<Select.Root type="single" bind:value={sortBy}>
					<Select.Trigger class="w-[180px]">
						{sortBy === 'firstName' ? 'First Name' : 'Last Name'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each [{ value: 'firstName', label: 'First Name' }, { value: 'lastName', label: 'Last Name' }] as { value, label }}
								<Select.Item {value} {label}>
									{label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</div>
		<div>
			<Label for="view">View</Label>
			<div id="view" class="mb-2 flex items-center space-x-2">
				<Select.Root type="single" bind:value={view}>
					<Select.Trigger class="w-[180px]">
						{view === 'grid' ? 'Grid' : 'List'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Item label="Grid" value="grid">Grid</Select.Item>
							<Select.Item label="List" value="list">List</Select.Item>
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<div>
			<Label for="randomSwitch">See...</Label>
			<div id="randomSwitch" class="mb-2 flex items-center space-x-2">
				<Select.Root type="single" bind:value={showRandomSwitch}>
					<Select.Trigger class="w-[180px]">
						{showRandomSwitch === 'null'
							? 'everybody'
							: showRandomSwitch === 'false'
								? 'people without random switch'
								: 'people with random switch'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Item label="everybody" value="null">everybody</Select.Item
							>
							<Select.Item label="people without random switch" value="false">
								people without random switch
							</Select.Item>
							<Select.Item label="people with random switch" value="true">
								people with random switch
							</Select.Item>
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</div>
		<div>
			<Label for="randomSwitch">Number of events</Label>
			<div id="randomSwitch" class="mb-2 flex items-center space-x-2">
				<Select.Root type="multiple" bind:value={numberOfEvents}>
					<Select.Trigger class="w-[180px]">
						{numberOfEvents.toSorted().join(', ') || 'None'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each [0, 1, 2, 3, 4, 5, 6] as i}
								<Select.Item label={i.toString()} value={i.toString()}>
									{i}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	</div>

	<Input
		class="mb-4"
		bind:value={search}
		type="search"
		id="search"
		placeholder="Search"
	/>

	<p><span class="text-red-500">Red</span> = not enough events</p>
	<p>
		<span class="text-orange-500">Orange</span> = doesn't have teams for {MIN_EVENTS}
		events
	</p>
	<p>
		<span class="text-yellow-500">Yellow</span> = doesn't have a team for all events
	</p>
	<p class="mb-4">
		Event format: [event name] ([team number] [👑 if team captain])
	</p>

	{#if view === 'grid'}
		<div
			class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 sm:items-start xl:grid-cols-3"
		>
			{#each $allUsersCollection.toSorted( (a, b) => (sortBy === 'firstName' ? a.name : (a.lastName ?? '')).localeCompare(sortBy === 'firstName' ? b.name : (b.lastName ?? '')), ) as user (user.email)}
				<MemberGridCard
					{user}
					show={results.includes(user) &&
						((showRandomSwitch === 'false' && !user.random) ||
							(showRandomSwitch === 'true' && user.random) ||
							showRandomSwitch === 'null')}
				/>
			{/each}
		</div>
	{:else}
		<TableView {results} />
	{/if}
</div>
