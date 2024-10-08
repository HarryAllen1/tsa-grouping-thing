<script lang="ts">
	import {
		db,
		eventsCollection,
		tShirtMap,
		user as userStore,
		type UserDoc,
	} from '$lib';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import * as Table from '$lib/components/ui/table';
	import { doc, setDoc } from 'firebase/firestore';
	import UserCard from '../UserCard.svelte';

	let { results }: { results: UserDoc[] } = $props();
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Washington ID</Table.Head>
			<Table.Head>Name</Table.Head>
			<Table.Head>Switch</Table.Head>
			<Table.Head>T-shirt</Table.Head>
			<Table.Head>Events</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each results as user (user.email)}
			<Table.Row>
				<Table.Cell>{user.washingtonId}</Table.Cell>
				<Table.Cell>
					<HoverCard.Root>
						<HoverCard.Trigger>
							{user.name}
						</HoverCard.Trigger>
						<HoverCard.Content>
							<UserCard {user} />
						</HoverCard.Content>
					</HoverCard.Root>
				</Table.Cell>
				<Table.Cell>
					<Switch
						checked={user.random ?? false}
						onCheckedChange={async (e) => {
							await setDoc(
								doc(db, 'users', user.email),
								{
									random: e,
									lastUpdatedBy: $userStore?.email ?? '',
								},
								{ merge: true },
							);
						}}
					/>
				</Table.Cell>
				<Table.Cell>
					<Select.Root
						selected={user.tShirtSize
							? {
									value: user.tShirtSize,
									label: tShirtMap.get(user.tShirtSize),
								}
							: { value: 'null', label: 'Unspecified' }}
						onSelectedChange={async (s) => {
							if (s)
								await setDoc(
									doc(db, 'users', user.email),
									{
										tShirtSize: s.value,
									},
									{ merge: true },
								);
						}}
					>
						<Select.Trigger class="w-32">
							<Select.Value placeholder="T-shirt size" />
						</Select.Trigger>
						<Select.Content>
							{#each tShirtMap.entries() as [value, label]}
								<Select.Item {value}>{label}</Select.Item>
							{/each}
							<Select.Item value="null">Unspecified</Select.Item>
						</Select.Content>
					</Select.Root>
				</Table.Cell>
				<Table.Cell class="text-right">
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
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
