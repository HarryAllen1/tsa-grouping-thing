<script lang="ts">
	import {
		db,
		eventsCollection,
		tShirtMap,
		user as userStore,
		type UserDoc,
	} from '$lib';
	import * as Popover from '$lib/components/ui/popover';
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
					<Popover.Root>
						<Popover.Trigger>
							{user.name}
						</Popover.Trigger>
						<Popover.Content>
							<UserCard {user} />
						</Popover.Content>
					</Popover.Root>
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
					{@const selected = user.tShirtSize
						? tShirtMap.get(user.tShirtSize)
						: 'Unspecified'}
					<Select.Root
						type="single"
						value={user.tShirtSize ?? 'null'}
						onValueChange={async (v) => {
							if (v)
								await setDoc(
									doc(db, 'users', user.email),
									{
										tShirtSize: v,
									},
									{ merge: true },
								);
						}}
					>
						<Select.Trigger class="w-32">
							{selected}
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
