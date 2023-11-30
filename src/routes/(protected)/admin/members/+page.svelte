<script lang="ts">
	import { allUsersCollection, db } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { doc, setDoc } from 'firebase/firestore';
	import { ChevronsUpDown, Save } from 'lucide-svelte';
	import Fuse from 'fuse.js';

	let search = '';
	$: fuse = new Fuse($allUsersCollection, {
		keys: ['name', 'email', 'grade', 'events', 'nationalId', 'washingtonId'],
		threshold: 0.2,
	});
	$: results =
		search === ''
			? $allUsersCollection
			: fuse.search(search).map((r) => r.item);

	const valuesMap: Record<string, Record<string, number | undefined>> = {};

	let updated = false;
	allUsersCollection.subscribe((users) => {
		if (updated || !users.length) return;
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
		class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl my-4"
	>
		Members
	</h1>
	<p class="text-red-500 mb-4">
		This is one of the few pages that doesn't update live (i was lazy).
		<span class="text-bold">
			Avoid editing this page at the same time as someone else.
		</span>
	</p>

	<Input
		class="mb-4"
		bind:value={search}
		type="search"
		id="search"
		placeholder="Search"
	/>

	<div
		class="grid items-center w-full gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 lg:items-start"
	>
		{#each $allUsersCollection as user}
			{@const hash = user.email.replaceAll('@', '').replaceAll('.', '')}
			<Card.Root class={results.includes(user) ? '' : 'hidden'}>
				<Card.Header>
					<Card.Title>
						{user.name}
						{#if user.grade}
							({user.grade})
						{/if}
					</Card.Title>
					<Card.Description>
						<a href="mailto:{user.email}" class="underline">{user.email}</a>
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-col gap-4">
					<div class="flex items-center space-x-2">
						<Switch
							id="{hash}admin"
							checked={user.admin}
							onCheckedChange={async (e) => {
								await setDoc(
									doc(db, 'users', user.email),
									{ admin: e },
									{ merge: true },
								);
							}}
						/>
						<Label for="{hash}admin">Admin</Label>
					</div>
					<div class="flex flex-col w-full max-w-sm gap-1.5">
						<Label for="{hash}natid">National ID</Label>
						<Input
							bind:value={valuesMap[user.email].nationalId}
							type="number"
							id="{hash}natid"
							placeholder="123456"
						/>
						<Button
							disabled={valuesMap[user.email].nationalId?.toString() ===
								user.nationalId?.toString()}
							size="icon"
							on:click={async () => {
								await setDoc(
									doc(db, 'users', user.email),
									{
										nationalId: parseInt(
											(valuesMap[user.email].nationalId ?? 0).toString(),
										),
									},
									{ merge: true },
								);
							}}
						>
							<Save />
						</Button>
					</div>
					<div class="flex flex-col w-full max-w-sm gap-1.5">
						<Label for="{hash}wtsaid">WTSA ID</Label>
						<Input
							bind:value={valuesMap[user.email].washingtonId}
							type="number"
							id="{hash}wtsaid"
							placeholder="123456"
						/>
						<Button
							disabled={valuesMap[user.email].washingtonId?.toString() ===
								user.washingtonId?.toString()}
							size="icon"
							on:click={async () => {
								await setDoc(
									doc(db, 'users', user.email),
									{
										washingtonId: (
											valuesMap[user.email].washingtonId ?? 0
										).toString(),
									},
									{ merge: true },
								);
							}}
						>
							<Save />
						</Button>
					</div>
					<div class="w-full">
						<Collapsible.Root>
							<Collapsible.Trigger asChild let:builder>
								<Button
									builders={[builder]}
									variant="ghost"
									size="sm"
									class="p-2 flex items-center w-full {user.events.length < 4 ||
									user.events.length > 6
										? 'text-red-500'
										: ''}"
								>
									Events
									<div class="flex-1"></div>
									<ChevronsUpDown class="h-4 w-4" />
								</Button>
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Button href="/events/{user.email}">Edit</Button>
								{#each user.events as event}
									<p>{event}</p>
								{/each}
							</Collapsible.Content>
						</Collapsible.Root>
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</div>
