<script lang="ts">
	import { allUsersCollection, fancyConfirm, db, type UserDoc } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import { csvFormat } from 'd3';
	import Fuse from 'fuse.js';
	import Download from 'lucide-svelte/icons/download';
	import CopyButton from './CopyButton.svelte';
	import MemberGridCard from './MemberGridCard.svelte';
	import TableView from './TableView.svelte';
	import { collection, deleteDoc, getDocs, setDoc } from 'firebase/firestore';

	let search = $state('');
	let hidePeopleWithoutEvents = $state(false);
	let sortBy = $state({
		value: 'firstName',
		label: 'First Name',
	});
	let view = $state({
		value: 'grid',
		label: 'Grid',
	});
	let showRandomSwitch = $state<{
		label: string;
		value: 'null' | 'false' | 'true';
	}>({
		label: 'everybody',
		value: 'null',
	});

	let fuse = $derived(
		new Fuse($allUsersCollection, {
			keys: ['name', 'email', 'grade', 'events', 'nationalId', 'washingtonId'],
			threshold: 0.2,
		}),
	);
	let results = $derived(
		search === ''
			? $allUsersCollection
					.toSorted((a, b) => a.name.localeCompare(b.name))
					.filter((u) => !hidePeopleWithoutEvents || u.events.length > 0)
			: fuse.search(search).map((r) => r.item),
	);
</script>

<div class="container pb-4">
	<h1
		class="my-4 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
	>
		Members
	</h1>

	<div class="flex flex-row gap-2">
		<Button
			class="mb-4"
			on:click={() => {
				for (const el of document.querySelectorAll(
					'.member-collapsible:not([data-state="open"])',
				)) {
					if (el instanceof HTMLButtonElement) el.click();
				}
			}}
		>
			Expand all events
		</Button>

		<CopyButton />
		<Button
			size="icon"
			on:click={() => {
				alert(
					'Make sure to go look at this file in Excel and ensure that all information is correct and remove any unnecessary rows before submitting.',
				);
				const csv = csvFormat(
					$allUsersCollection.map((u) => ({
						'First Name': u.firstName ?? u.name.split(' ')[0],
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
			on:click={async () => {
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
	<div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
		<div>
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
		</div>
		<div>
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
		</div>

		<div>
			<Label for="randomSwitch">See...</Label>
			<div id="randomSwitch" class="mb-2 flex items-center space-x-2">
				<Select.Root bind:selected={showRandomSwitch}>
					<Select.Trigger class="w-[180px]">
						<Select.Value placeholder="everybody" />
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
					<Select.Input name="randomSwitch" />
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
