<script lang="ts">
	import { allUsersCollection } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import Fuse from 'fuse.js';
	import CopyButton from './CopyButton.svelte';
	import TableView from './TableView.svelte';
	import MemberGridCard from './MemberGridCard.svelte';

	let search = '';
	let hidePeopleWithoutEvents = false;
	let sortBy = {
		value: 'firstName',
		label: 'First Name',
	};
	let view = {
		value: 'grid',
		label: 'Grid',
	};
	let showRandomSwitch: {
		label: string;
		value: 'null' | 'false' | 'true';
	} = {
		label: 'everybody',
		value: 'null',
	};

	$: fuse = new Fuse($allUsersCollection, {
		keys: ['name', 'email', 'grade', 'events', 'nationalId', 'washingtonId'],
		threshold: 0.2,
	});
	$: results =
		search === ''
			? $allUsersCollection
					.toSorted((a, b) => a.name.localeCompare(b.name))
					.filter((u) => !hidePeopleWithoutEvents || u.events.length > 0)
			: fuse.search(search).map((r) => r.item);

	const valuesMap: Record<string, Record<string, number | undefined>> = {};

	let updated = false;
	allUsersCollection.subscribe((users) => {
		if (updated || users.length < 2) return;
		updated = true;
		users.forEach((user) => {
			valuesMap[user.email] = {
				nationalId: user.nationalId,
				washingtonId: user.washingtonId,
			};
		});
	});
</script>

<div class="container">
	<h1
		class="my-4 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
	>
		Members
	</h1>
	<p class="mb-4 text-red-500">
		The National ID and WTSA ID fields do not update live
	</p>

	<div class="flex flex-row gap-2">
		<Button
			class="mb-4"
			on:click={() => {
				document
					.querySelectorAll('.member-collapsible:not([data-state="open"])')
					.forEach((el) => {
						if (el instanceof HTMLButtonElement) el.click();
					});
			}}
		>
			Expand all events
		</Button>

		<CopyButton />
	</div>

	<div class="mb-2 flex items-center space-x-2">
		<Switch bind:checked={hidePeopleWithoutEvents} id="hide-people" />
		<Label for="hide-people">Hide people without events</Label>
	</div>
	<Label for="sortBy">Sort by</Label>
	<div id="sortBy" class="mb-2 flex items-center space-x-2">
		<Select.Root bind:selected={sortBy}>
			<Select.Trigger class="w-[180px]">
				<Select.Value placeholder="Sort by..." />
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
			<Select.Input name="favoriteFruit" />
		</Select.Root>
	</div>
	<Label for="view">View</Label>
	<div id="view" class="mb-2 flex items-center space-x-2">
		<Select.Root bind:selected={view}>
			<Select.Trigger class="w-[180px]">
				<Select.Value placeholder="View..." />
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					<Select.Item label="Grid" value="grid">Grid</Select.Item>
					<Select.Item label="List" value="list">List</Select.Item>
				</Select.Group>
			</Select.Content>
			<Select.Input name="favoriteFruit" />
		</Select.Root>
	</div>

	<Label for="randomSwitch">See...</Label>
	<div id="randomSwitch" class="mb-2 flex items-center space-x-2">
		<Select.Root bind:selected={showRandomSwitch}>
			<Select.Trigger class="w-[180px]">
				<Select.Value placeholder="everybody" />
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					<Select.Item label="everybody" value="null">everybody</Select.Item>
					<Select.Item label="people without random switch" value="false">
						people without random switch
					</Select.Item>
					<Select.Item label="people with random switch" value="true">
						people with random switch
					</Select.Item>
				</Select.Group>
			</Select.Content>
			<Select.Input name="randomSwitch" />
		</Select.Root>
	</div>

	<Input
		class="mb-4"
		bind:value={search}
		type="search"
		id="search"
		placeholder="Search"
	/>

	<p>Red = not enough events</p>
	<p>Yellow = doesn't have a team for all events</p>
	<p class="mb-4">
		Event format: [event name] ([team number] [👑 if team captain])
	</p>

	{#if view.value === 'grid'}
		<div
			class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:items-start xl:grid-cols-3"
		>
			{#each $allUsersCollection.toSorted( (a, b) => (sortBy.value === 'firstName' ? a.name : a.lastName ?? '').localeCompare(sortBy.value === 'firstName' ? b.name : b.lastName ?? ''), ) as user (user.email)}
				<MemberGridCard
					{user}
					show={results.includes(user) &&
						((showRandomSwitch.value === 'false' && !user.random) ||
							(showRandomSwitch.value === 'true' && user.random) ||
							showRandomSwitch.value === 'null')}
				/>
			{/each}
		</div>
	{:else}
		<TableView {results} />
	{/if}
</div>
