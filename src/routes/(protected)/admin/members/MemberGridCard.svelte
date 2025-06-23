<script lang="ts">
	import { fancyConfirm } from '$lib/FancyConfirm.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { Switch } from '$lib/components/ui/switch';
	import { MIN_EVENTS } from '$lib/constants';
	import { db } from '$lib/firebase';
	import { eventsCollection, user as userStore } from '$lib/stores';
	import type { UserDoc } from '$lib/types';
	import { doc, setDoc } from 'firebase/firestore';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import Save from '@lucide/svelte/icons/save';
	import ToggleRight from '@lucide/svelte/icons/toggle-right';
	import UserCog from '@lucide/svelte/icons/user-cog';

	let { user, show = true }: { user: UserDoc; show?: boolean } = $props();

	const hash = $props.id();
	const values = $state({
		nationalId: user.nationalId,
		washingtonId: user.washingtonId,
	});
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
					if (
						e &&
						!(await fancyConfirm(
							`Are you sure?`,
							`Are you sure you want to make ${user.name} an admin?`,
						))
					) {
						user.admin = false;
						return;
					}
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
				<Popover.Root>
					<Popover.Trigger>
						<CircleHelp class="size-5" />
					</Popover.Trigger>
					<Popover.Content>
						Turn off to force the user to re-complete the intake form.
					</Popover.Content>
				</Popover.Root>
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
		<div class="flex items-center space-x-2">
			<Switch
				id="{hash}room-lock"
				checked={user.lockRooming ?? false}
				onCheckedChange={async (e) => {
					await setDoc(
						doc(db, 'users', user.email),
						{
							lockRooming: e,
							lastUpdatedBy: $userStore?.email ?? '',
						},
						{ merge: true },
					);
				}}
			/>
			<Label for="{hash}room-lock" class="flex flex-row items-center gap-2">
				<p>Prevent rooming</p>
				<Popover.Root>
					<Popover.Trigger>
						<CircleHelp class="size-5" />
					</Popover.Trigger>
					<Popover.Content>
						Prevents this user from being added to room. Enable this if a
						student is rooming with a parent.
					</Popover.Content>
				</Popover.Root>
			</Label>
		</div>
		<div class="flex items-center space-x-2">
			<Switch
				id="{hash}account-locked"
				checked={user.locked}
				onCheckedChange={async (e) => {
					await setDoc(
						doc(db, 'users', user.email),
						{ locked: e, lastUpdatedBy: $userStore?.email ?? '' },
						{ merge: true },
					);
				}}
			/>
			<Label
				for="{hash}account-locked"
				class="flex flex-row items-center gap-2"
			>
				<p>Lock account details</p>
				<Popover.Root>
					<Popover.Trigger>
						<CircleHelp class="size-5" />
					</Popover.Trigger>
					<Popover.Content>
						Prevents this user from changing their account details (gender,
						t-shirt, name, etc.). Members can still change their events with
						this setting on.
					</Popover.Content>
				</Popover.Root>
			</Label>
		</div>
		<div class="flex items-center space-x-2">
			<Switch
				id="{hash}account-locked"
				checked={user.eventsLocked}
				onCheckedChange={async (e) => {
					await setDoc(
						doc(db, 'users', user.email),
						{ eventsLocked: e, lastUpdatedBy: $userStore?.email ?? '' },
						{ merge: true },
					);
				}}
			/>
			<Label for="{hash}events-locked" class="flex flex-row items-center gap-2">
				<p>Lock events</p>
				<Popover.Root>
					<Popover.Trigger>
						<CircleHelp class="size-5" />
					</Popover.Trigger>
					<Popover.Content>
						Prevents this user from changing their events. The user can still
						change their teams. Lock the team to prevent this.
					</Popover.Content>
				</Popover.Root>
			</Label>
		</div>

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
					onclick={async () => {
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
					onclick={async () => {
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

		<div class="w-full">
			<Collapsible.Root>
				<Collapsible.Trigger>
					{#snippet child({ props })}
						<Button
							variant="ghost"
							size="sm"
							class="member-collapsible flex w-full items-center p-2 {user
								.events.length < MIN_EVENTS || user.events.length > 6
								? 'text-red-500'
								: user.events
											.map((e) => {
												const event = $eventsCollection.find(
													(ev) => ev.event === e,
												);
												return (
													event?.teams.find(
														(t) =>
															t.members.find((m) => m.email === user.email) &&
															t.members.length >= event.minTeamSize,
													) ?? null
												);
											})
											.filter(Boolean).length < MIN_EVENTS
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
							{...props}
						>
							Events ({user.events.length})
							<div class="flex-1"></div>
							<ChevronsUpDown class="h-4 w-4" />
						</Button>
					{/snippet}
				</Collapsible.Trigger>
				<Collapsible.Content>
					<Button href="/events/{user.email}">Edit</Button>
					{#each user.events as event}
						{@const maybeTeam = $eventsCollection
							.find((e) => e.event === event)
							?.teams.find((t) =>
								t.members.find((m) => m.email === user.email),
							)}
						<p
							class={[
								'flex flex-row',
								!maybeTeam && 'text-red-500',
								maybeTeam &&
									maybeTeam?.members.length <
										$eventsCollection.find((ev) => ev.event === event)!
											.minTeamSize &&
									'text-yellow-500',
							]}
						>
							{event}

							{#if maybeTeam}
								({maybeTeam.teamNumber}{#if maybeTeam.teamCaptain?.toLowerCase() === user.email?.toLowerCase()}👑{/if})
							{/if}

							{#if maybeTeam?.random}
								<ToggleRight class="ml-2" />
							{/if}
						</p>
					{/each}
				</Collapsible.Content>
			</Collapsible.Root>
		</div>
	</Card.Content>
</Card.Root>
