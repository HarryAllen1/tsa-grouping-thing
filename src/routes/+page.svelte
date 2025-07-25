<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Label } from '$lib/components/ui/label';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Switch } from '$lib/components/ui/switch';
	import { MIN_EVENTS } from '$lib/constants';
	import { sendRequestApproval, sendRequestDenial } from '$lib/functions';
	import { md } from '$lib/md';
	import {
		allUsersCollection,
		eventsCollection,
		settings,
		user,
		userDoc,
	} from '$lib/stores';
	import type { EventDoc } from '$lib/types';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import confetti from 'canvas-confetti';
	import { mount, onDestroy, unmount } from 'svelte';
	import { persisted } from 'svelte-persisted-store';
	import { toast } from 'svelte-sonner';
	import Copyable from './Copyable.svelte';
	import EventCard from './EventCard.svelte';

	const yellowMode = persisted('yellowMode', false);
	let alertEl = $state<HTMLDivElement>();

	const toUnmount: Record<string, object>[] = [];

	const addAlertStuff = (el: HTMLDivElement | undefined) => {
		if (!el) return;

		const copyables = el.querySelectorAll('.copyable');

		for (const copyable of copyables as unknown as HTMLElement[]) {
			toUnmount.push(
				mount(Copyable, {
					target: copyable,
					props: {
						text: copyable.textContent ?? '',
					},
				}),
			);
		}
	};

	$effect(() => {
		addAlertStuff(alertEl);
	});

	$effect(() => {
		if ($yellowMode) {
			document.body.classList.add('yellow');
		} else {
			document.body.classList.remove('yellow');
		}
	});

	let signedUpEvents = $derived(
		$user
			? $eventsCollection.length > 0
				? ($userDoc?.events
						? [
								...$userDoc.events,
								...$eventsCollection
									.filter((e) => e.showToEveryone)
									.map((e) => e.event),
							]
						: []
					)
						.map((e) => ({
							...$eventsCollection.find((ev) => ev.event === e),
						}))
						.toSorted((a, b) => a.event!.localeCompare(b.event!))
				: []
			: [],
	) as EventDoc[];
	let eventData = $derived(
		$eventsCollection.length > 0 && $user
			? $eventsCollection
					.map((e) => ({
						...e,
						members: (
							$allUsersCollection?.filter((m) => m.events.includes(e.event)) ??
							[]
						).map((m) => ({
							name: m.name,
							email: m.email,
						})),
					}))
					.toSorted((a, b) => a.event.localeCompare(b.event))
			: [],
	);

	let requests = $derived(
		signedUpEvents
			.filter(
				(e) =>
					e.teams
						.filter((t) =>
							t.members.some(
								(u) => u.email.toLowerCase() === $user.email?.toLowerCase(),
							),
						)
						.some((t) => t.requests?.length) && !e.locked,
			)
			.map((e) => ({
				event: e.event,
				team: e.teams.find(
					(t) =>
						t.requests?.length &&
						!t.locked &&
						!e.locked &&
						t.members
							.map((u) => u.email.toLowerCase())
							.includes($user?.email?.toLowerCase() ?? ''),
				),
				requests: e.teams
					.filter(
						(t) =>
							t.requests?.length &&
							!t.locked &&
							!e.locked &&
							t.members
								.map((u) => u.email.toLowerCase())
								.includes($user?.email?.toLowerCase() ?? ''),
					)
					.flatMap((t) => t.requests ?? [])
					.filter(
						(r) =>
							!e.teams
								.filter((t) =>
									t.members.some(
										(u) => u.email.toLowerCase() !== $user.email?.toLowerCase(),
									),
								)
								.flatMap((t) => t.members)
								.some((u) => u.email.toLowerCase() === r.email.toLowerCase()),
					),
			}))
			.filter((r) => r.requests.length > 0),
	);

	let eventsWithCheckIn = $derived(
		signedUpEvents.filter(
			(e) =>
				e.eventStatusCheckInEnabled &&
				e.teams.find((t) =>
					t.members.find((u) => u.email === $userDoc.email),
				) &&
				!e.teams.find((t) => t.members.find((u) => u.email === $userDoc.email))
					?.checkInComplete,
		),
	);

	onDestroy(() => {
		for (const comp of toUnmount) unmount(comp);
	});
</script>

<svelte:head>
	<title>Teams — JHS TSA Teaming</title>
</svelte:head>

<div class="container mx-auto mt-2 flex flex-col items-center">
	<Button
		href="/events"
		size="lg"
		class="mb-4 h-24 w-full bg-green-400 text-3xl text-black hover:bg-green-500"
	>
		Edit events
	</Button>

	{#if eventsWithCheckIn.length > 0}
		<Alert.Root variant="destructive" class="mb-4">
			<Alert.Title class="text-2xl font-bold">
				You have incomplete check-ins
			</Alert.Title>
			<Alert.Description>
				<p class="leading-7 [&:not(:first-child)]:mt-6">
					Check-ins are required for your progress for the January Qualifier and
					the State Conference to be gauged. Please complete your check-ins for
					the following events:
				</p>
				<ul class="my-2 ml-6 list-disc [&>li]:mt-2">
					{#each eventsWithCheckIn as event}
						<li>{event.event}</li>
					{/each}
				</ul>
			</Alert.Description>
		</Alert.Root>
	{/if}

	{#if requests.length}
		<div class="w-full">
			<h3 class="my-4 scroll-m-20 text-2xl font-semibold tracking-tight">
				Manage Requests
			</h3>
			{#each requests as request}
				<Collapsible.Root>
					<Collapsible.Trigger>
						{#snippet child({ props })}
							<Button
								variant="ghost"
								size="sm"
								class="flex w-full items-center p-2 font-bold"
								{...props}
							>
								{request.event}
								<div class="flex-1"></div>
								<ChevronsUpDown />
							</Button>
						{/snippet}
					</Collapsible.Trigger>
					<Collapsible.Content class="px-2">
						<ul>
							{#each request.requests ?? [] as r}
								<li class="flex flex-row">
									{r.name}
									<Button
										onclick={async (clickEvent) => {
											(clickEvent.target as HTMLButtonElement).disabled = true;
											const actualEvent = signedUpEvents.find(
												(e) => e.event === request.event,
											);
											if (!actualEvent) return;
											const event = actualEvent.teams;
											if (!event) return;

											await sendRequestApproval({
												event: request.event,
												teamId: request.team?.id ?? '',
												userEmail: r.email,
											})
												.then(() => {
													toast.success(
														`Request for ${r.name} approved successfully.`,
													);
													confetti();
													navigator.vibrate(100);
												})
												.catch((error) => {
													toast.error(`Failed to approve request: ${error}`);
												});
											(clickEvent.target as HTMLButtonElement).disabled = false;
										}}
										size="icon"
										class="h-5"
										variant="ghost"
									>
										<Plus />
									</Button>
									<Button
										size="icon"
										class="h-5"
										variant="ghost"
										onclick={async (clickEvent) => {
											(clickEvent.target as HTMLButtonElement).disabled = true;
											await sendRequestDenial({
												event: request.event,
												teamId: request.team?.id ?? '',
												userEmail: r.email,
											})
												.then(() => {
													toast.success(
														`Request for ${r.name} denied successfully.`,
													);
												})
												.catch((error) => {
													toast.error(`Failed to deny request: ${error}`);
												});
											(clickEvent.target as HTMLButtonElement).disabled = false;
										}}
									>
										<Minus />
									</Button>
								</li>
							{:else}
								<li>No requests</li>
							{/each}
						</ul>
					</Collapsible.Content>
				</Collapsible.Root>
			{/each}
		</div>
	{/if}

	{#if $settings?.alert}
		<div
			class="prose dark:prose-invert w-full max-w-full dark:text-white"
			bind:this={alertEl}
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html md.render(
				$settings.alert
					.replaceAll(
						'{{washingtonId}}',
						Number($userDoc?.washingtonId) > 0
							? $userDoc.washingtonId!.toString()
							: 'Unassigned',
					)
					.replaceAll(
						'{{nationalId}}',
						Number($userDoc?.nationalId) > 0
							? $userDoc.nationalId!.toString()
							: 'Unassigned',
					)
					.replaceAll('{{firstName}}', $userDoc?.firstName ?? '')
					.replaceAll('{{lastName}}', $userDoc?.lastName ?? ''),
			)}
		</div>
	{/if}

	<h2
		class="my-4 w-full scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors"
	>
		Your Teams
	</h2>

	{#if !signedUpEvents || signedUpEvents.length === 0}
		<p class="mt-4 w-full">
			You haven't signed up for any events yet. Please add some events on the <a
				href="/events"
				class="font-medium underline underline-offset-4">event sign up page.</a
			>
		</p>
	{:else}
		{#if signedUpEvents.length < MIN_EVENTS}
			<p class="my-4 w-full">
				You haven't signed up for enough events yet. Please add some more events
				on the <a
					href="/events"
					class="font-medium underline underline-offset-4"
					>event sign up page.</a
				>
			</p>
		{/if}

		<div
			class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 sm:items-start xl:grid-cols-3"
		>
			{#each signedUpEvents as event (event.event)}
				<EventCard {event} {eventData} />
			{:else}
				<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
				{#each { length: 9 } as _}
					<Skeleton class="h-[32rem] w-full" />
				{/each}
			{/each}
		</div>
	{/if}
	<div class="my-4 flex items-center space-x-2">
		<Switch bind:checked={$yellowMode} id="yellow" />
		<Label for="yellow">Yellow mode</Label>
	</div>
</div>
