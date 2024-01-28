<script lang="ts">
	import {
		allUsersCollection,
		db,
		eventsCollection,
		user as userStore,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { doc, setDoc } from 'firebase/firestore';
	import Fuse from 'fuse.js';
	import * as Select from '$lib/components/ui/select';
	import { ChevronsUpDown, Save } from 'lucide-svelte';

	let search = '';
	$: fuse = new Fuse($allUsersCollection, {
		keys: ['name', 'email', 'grade', 'events', 'nationalId', 'washingtonId'],
		threshold: 0.2,
	});
	$: results =
		search === ''
			? $allUsersCollection.toSorted((a, b) => a.name.localeCompare(b.name))
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

	// const stuff: {
	// 	email: string;
	// 	waId: number;
	// 	natId: number;
	// 	events: {
	// 		eventId: number;
	// 		teamNumber: number;
	// 		isCaptain: boolean;
	// 		event: string;
	// 		isTeamEvent: boolean;
	// 	}[];
	// }[] = [];

	// let logged = false;
	// $: if ($allUsersCollection.length && $eventsCollection.length && !logged) {
	// 	for (const u of $allUsersCollection) {
	// 		const events: {
	// 			eventId: number;
	// 			teamNumber: number;
	// 			isCaptain: boolean;
	// 			event: string;
	// 			isTeamEvent: boolean;
	// 		}[] = [];
	// 		for (const event of u.events) {
	// 			const team = $eventsCollection
	// 				.find((e) => e.event === event)
	// 				?.teams.find((t) => t.members.find((m) => m.email === u.email));
	// 			const eventInfo = $eventsCollection.find((e) => e.event === event);

	// 			if (team && eventInfo) {
	// 				events.push({
	// 					event: eventInfo.event,
	// 					eventId: eventInfo.id,
	// 					teamNumber: team.teamNumber,
	// 					isTeamEvent: eventInfo.maxTeamSize > 1,
	// 					isCaptain:
	// 						team.teamCaptain?.toLowerCase() === u.email?.toLowerCase(),
	// 				});
	// 			}
	// 		}

	// 		stuff.push({
	// 			email: u.email,
	// 			waId: u.washingtonId ?? 0,
	// 			natId: u.nationalId ?? 0,
	// 			events,
	// 		});
	// 	}

	// 	console.log(stuff);
	// 	logged = true;
	// }
</script>

<div class="container">
	<h1
		class="my-4 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
	>
		Members
	</h1>
	<p class="mb-4 text-red-500">
		This is one of the few pages that doesn't update live (i was lazy).
		<span class="text-bold">
			Avoid editing this page at the same time as someone else.
		</span>
	</p>

	<p>Red = not enough events</p>
	<p>Yellow = doesn't have a team for all events</p>

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

	<Input
		class="mb-4"
		bind:value={search}
		type="search"
		id="search"
		placeholder="Search"
	/>

	<div
		class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:items-start xl:grid-cols-3"
	>
		{#each $allUsersCollection.toSorted( (a, b) => a.name.localeCompare(b.name), ) as user}
			{@const hash = user.email.replaceAll('@', '').replaceAll('.', '')}
			{#if valuesMap[user.email]}
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
										{ admin: e, lastUpdatedBy: $userStore?.email ?? '' },
										{ merge: true },
									);
								}}
							/>
							<Label for="{hash}admin">Admin</Label>
						</div>
						<div class="flex w-full max-w-sm flex-col gap-1.5">
							<Label for="{hash}natid">National ID</Label>
							<div class="flex flex-row gap-2">
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
												lastUpdatedBy: $userStore?.email ?? '',
											},
											{ merge: true },
										);
									}}
								>
									<Save />
								</Button>
							</div>
						</div>
						<div class="flex w-full max-w-sm flex-col gap-1.5">
							<Label for="{hash}wtsaid">WTSA ID</Label>
							<div class="flex flex-row gap-2">
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
												lastUpdatedBy: $userStore?.email ?? '',
											},
											{ merge: true },
										);
									}}
								>
									<Save />
								</Button>
							</div>
						</div>
						<Label>
							<span class="mb-2"> Gender </span>
							<Select.Root
								selected={user.gender
									? { value: user.gender, label: user.gender }
									: { value: 'null', label: 'Unspecified' }}
								onSelectedChange={async (s) => {
									if (s)
										await setDoc(
											doc(db, 'users', user.email),
											{
												gender: s.value,
											},
											{ merge: true },
										);
								}}
							>
								<Select.Trigger class="mt-2 w-full">
									<Select.Value placeholder="Gender" />
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="Male">Male</Select.Item>
									<Select.Item value="Female">Female</Select.Item>
									<Select.Item value="Non-Binary">Non-Binary</Select.Item>
									<Select.Item value="null">Unspecified</Select.Item>
								</Select.Content>
							</Select.Root>
						</Label>

						{#if user.demographic}
							<p>
								Demographic: {user.demographic}
							</p>
						{/if}
						{#if user.tShirtSize}
							<p>
								Shirt Size: {user.tShirtSize}
							</p>
						{/if}
						<div class="w-full">
							<Collapsible.Root>
								<Collapsible.Trigger asChild let:builder>
									<Button
										builders={[builder]}
										variant="ghost"
										size="sm"
										class="member-collapsible flex w-full items-center p-2 {user
											.events.length < 4 || user.events.length > 6
											? 'text-red-500'
											: user.events
														.map(
															(e) =>
																$eventsCollection
																	.find((ev) => ev.event === e)
																	?.teams.find((t) =>
																		t.members.find(
																			(m) => m.email === user.email,
																		),
																	) ?? null,
														)
														.filter((t) => t).length < 4
												? 'text-orange-500'
												: user.events
															.map(
																(e) =>
																	$eventsCollection
																		.find((ev) => ev.event === e)
																		?.teams.find((t) =>
																			t.members.find(
																				(m) => m.email === user.email,
																			),
																		) ?? null,
															)
															.filter((t) => t).length < user.events.length
													? 'text-yellow-500'
													: ''}"
									>
										Events ({user.events.length})
										<div class="flex-1" />
										<ChevronsUpDown class="h-4 w-4" />
									</Button>
								</Collapsible.Trigger>
								<Collapsible.Content>
									<Button href="/events/{user.email}">Edit</Button>
									{#each user.events as event}
										{@const maybeTeam = $eventsCollection
											.find((e) => e.event === event)
											?.teams.find((t) =>
												t.members.find((m) => m.email === user.email),
											)}
										<p class:text-red-500={!maybeTeam}>
											{event}

											{#if maybeTeam}
												({maybeTeam.teamNumber}{#if maybeTeam.teamCaptain?.toLowerCase() === user.email?.toLowerCase()}👑{/if})
											{/if}
										</p>
									{/each}
								</Collapsible.Content>
							</Collapsible.Root>
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		{/each}
	</div>
</div>
