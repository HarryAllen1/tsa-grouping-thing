<script lang="ts">
	import { db, eventsCollection, user as userStore, type UserDoc } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import { doc, setDoc } from 'firebase/firestore';
	import { ChevronsUpDown, Save } from 'lucide-svelte';
	import CircleHelp from 'lucide-svelte/icons/circle-help';
	import UserCog from 'lucide-svelte/icons/user-cog';

	let { user, show = true }: { user: UserDoc; show?: boolean } = $props();

	let hash = Math.random().toString(36).slice(7);
	let values = {
		nationalId: user.nationalId,
		washingtonId: user.washingtonId,
	};
</script>

<Card.Root class={show ? '' : 'hidden'}>
	<Card.Header>
		<Card.Title class="flex flex-row items-center justify-between">
			{user.name}
			{#if user.grade}
				({user.grade})
			{/if}

			<Button
				class="size-8"
				variant="ghost"
				size="icon"
				href="/account/{user.email}"
			>
				<UserCog />
			</Button>
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
		<div class="flex items-center space-x-2">
			<Switch
				id="{hash}completedIntakeForm"
				checked={user.completedIntakeForm}
				onCheckedChange={async (e) => {
					await setDoc(
						doc(db, 'users', user.email),
						{ completedIntakeForm: e, lastUpdatedBy: $userStore?.email ?? '' },
						{ merge: true },
					);
				}}
			/>
			<Label
				for="{hash}completedIntakeForm"
				class="flex flex-row items-center gap-2"
			>
				<p>Completed intake form</p>
				<HoverCard.Root>
					<HoverCard.Trigger>
						<CircleHelp class="size-5" />
					</HoverCard.Trigger>
					<HoverCard.Content>
						Turn off to force the user to re-complete the intake form.
					</HoverCard.Content>
				</HoverCard.Root>
			</Label>
		</div>
		<div class="flex items-center space-x-2">
			<Switch
				id="{hash}random"
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
			<Label for="{hash}random">Random switch</Label>
		</div>
		<Label>
			<span class="mb-2"> T-shirt size </span>
			<Select.Root
				selected={user.tShirtSize
					? { value: user.tShirtSize, label: user.tShirtSize }
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
				<Select.Trigger class="mt-2 w-full">
					<Select.Value placeholder="T-shirt size" />
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="W XS">W XS</Select.Item>
					<Select.Item value="W S">W S</Select.Item>
					<Select.Item value="W M">W M</Select.Item>
					<Select.Item value="W L">W L</Select.Item>
					<Select.Item value="W XL">W XL</Select.Item>
					<Select.Item value="W XXL">W XXL</Select.Item>
					<Select.Item value="M XS">M XS</Select.Item>
					<Select.Item value="M S">M S</Select.Item>
					<Select.Item value="M M">M M</Select.Item>
					<Select.Item value="M L">M L</Select.Item>
					<Select.Item value="M XL">M XL</Select.Item>
					<Select.Item value="M XXL">M XXL</Select.Item>
					<Select.Item value="null">Unspecified</Select.Item>
				</Select.Content>
			</Select.Root>
		</Label>
		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Label for="{hash}natid">National ID</Label>
			<div class="flex flex-row gap-2">
				<Input
					bind:value={values.nationalId}
					type="number"
					id="{hash}natid"
					placeholder="123456"
				/>
				<Button
					disabled={values.nationalId?.toString() ===
						user.nationalId?.toString()}
					size="icon"
					on:click={async () => {
						await setDoc(
							doc(db, 'users', user.email),
							{
								nationalId: Number.parseInt(
									(values.nationalId ?? 0).toString(),
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
					bind:value={values.washingtonId}
					type="number"
					id="{hash}wtsaid"
					placeholder="123456"
				/>
				<Button
					disabled={values.washingtonId?.toString() ===
						user.washingtonId?.toString()}
					size="icon"
					on:click={async () => {
						await setDoc(
							doc(db, 'users', user.email),
							{
								washingtonId: (values.washingtonId ?? 0).toString(),
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

		<Label>
			<span class="mb-2"> Demographic </span>
			<Select.Root
				selected={user.demographic
					? { value: user.demographic, label: user.demographic }
					: { value: 'null', label: 'Unspecified' }}
				onSelectedChange={async (s) => {
					if (s)
						await setDoc(
							doc(db, 'users', user.email),
							{
								demographic: s.value,
							},
							{ merge: true },
						);
				}}
			>
				<Select.Trigger class="mt-2 w-full">
					<Select.Value placeholder="Demographic" />
				</Select.Trigger>
				<Select.Content>
					{#each ['Opt-Out', 'Non-Disclosed', 'American Indian/Alaskan Native', 'Black / African-American', 'Asian/Asian-American/Pacific Islander', 'Hispanic/Latino', 'Mixed Race', 'White/Caucasian'] as demographic}
						<Select.Item value={demographic}>
							{demographic}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</Label>

		<div class="w-full">
			<Collapsible.Root>
				<Collapsible.Trigger asChild let:builder>
					<Button
						builders={[builder]}
						variant="ghost"
						size="sm"
						class="member-collapsible flex w-full items-center p-2 {user.events
							.length < 4 || user.events.length > 6
							? 'text-red-500'
							: user.events
										.map(
											(e) =>
												$eventsCollection
													.find((ev) => ev.event === e)
													?.teams.find((t) =>
														t.members.find((m) => m.email === user.email),
													) ?? null,
										)
										.filter(Boolean).length < 4
								? 'text-orange-500'
								: user.events
											.map(
												(e) =>
													$eventsCollection
														.find((ev) => ev.event === e)
														?.teams.find((t) =>
															t.members.find((m) => m.email === user.email),
														) ?? null,
											)
											.filter(Boolean).length < user.events.length
									? 'text-yellow-500'
									: ''}"
					>
						Events ({user.events.length})
						<div class="flex-1"></div>
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
