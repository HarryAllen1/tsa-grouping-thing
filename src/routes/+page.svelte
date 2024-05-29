<script lang="ts">
	import {
		allUsersCollection,
		aww,
		db,
		eventsCollection,
		md,
		sendEmail,
		settings,
		user,
		userDoc,
		yay,
		type EventDoc,
		type UserDoc,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { Label } from '$lib/components/ui/label';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Switch } from '$lib/components/ui/switch';
	import confetti from 'canvas-confetti';
	import { Timestamp, doc, setDoc } from 'firebase/firestore';
	import { ChevronsUpDown, Minus, Plus } from 'lucide-svelte';
	import { persisted } from 'svelte-local-storage-store';
	import Copyable from './Copyable.svelte';
	import EventCard from './EventCard.svelte';

	const yellowMode = persisted('yellowMode', false);
	let alertEl = $state<HTMLDivElement>();

	const addAlertStuff = (el: HTMLDivElement | undefined) => {
		if (!el) return;

		const copyables = el.querySelectorAll('.copyable');

		for (const copyable of copyables) {
			new Copyable({
				target: copyable,
				props: {
					text: copyable.textContent ?? '',
				},
			});
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
		$settings?.enableRooming && $user
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
			: $eventsCollection.length > 0
				? ($userDoc?.events ?? [])
						.map((e) => ({
							...$eventsCollection.find((ev) => ev.event === e),
						}))
						.toSorted((a, b) => a.event!.localeCompare(b.event!))
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
			.filter((e) => e.teams.some((t) => t.requests?.length) && !e.locked)
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
					.flatMap((t) => t.requests ?? []),
			}))
			.filter((r) => r.requests.length),
	);
</script>

<div class="container mt-8 flex flex-col items-center">
	<Button
		href="/events"
		size="lg"
		class="my-4 h-24 w-full bg-green-400 text-3xl text-black hover:bg-green-500"
	>
		Signup/change events
	</Button>

	{#if requests.length}
		<div class="w-full">
			<h3 class="my-4 scroll-m-20 text-2xl font-semibold tracking-tight">
				Manage Requests
			</h3>
			{#each requests as request}
				<Collapsible.Root>
					<Collapsible.Trigger asChild let:builder>
						<Button
							builders={[builder]}
							variant="ghost"
							size="sm"
							class="flex w-full items-center p-2 font-bold"
						>
							{request.event}
							<div class="flex-1"></div>
							<ChevronsUpDown />
						</Button>
					</Collapsible.Trigger>
					<Collapsible.Content class="px-2">
						<ul>
							{#each request.requests ?? [] as r}
								<li class="flex flex-row">
									{r.name}
									<Button
										on:click={async () => {
											const actualEvent = signedUpEvents.find(
												(e) => e.event === request.event,
											);
											if (!actualEvent) return;
											const event = actualEvent.teams;
											if (!event) return;

											let lowestNotTaken = 1;
											while (
												actualEvent.teams.some(
													(t) => t.teamNumber === lowestNotTaken,
												)
											) {
												lowestNotTaken++;
											}
											const teamUserIsIn = event?.find(
												(t) =>
													t.members
														.map((u) => u.email.toLowerCase())
														.includes($user?.email?.toLowerCase() ?? '') &&
													!t.locked,
											) ?? {
												members: [],
												requests: [],
												lastUpdatedBy: '',
												lastUpdatedTime: new Timestamp(0, 0),
												id: crypto.randomUUID(),
												teamNumber: 0,
											};
											teamUserIsIn.members.push({
												name: r.name,
												email: r.email,
											});
											teamUserIsIn.lastUpdatedBy = $user?.email ?? '';
											teamUserIsIn.lastUpdatedTime = new Timestamp(
												Date.now() / 1000,
												0,
											);
											teamUserIsIn.requests = teamUserIsIn.requests?.filter(
												(u) => u.email !== r.email,
											);
											await setDoc(
												doc(db, 'events', request.event ?? ''),
												{
													teams: signedUpEvents.find(
														(e) => e.event === request.event,
													)?.teams,
													lastUpdatedBy: $user?.email ?? '',
												},
												{
													merge: true,
												},
											);
											let members = teamUserIsIn.members
												.map((m) => m.name)
												.join(', ');
											const lastComma = members.lastIndexOf(',');
											if (lastComma !== -1) {
												members =
													members.slice(0, lastComma) +
													' and' +
													members.slice(lastComma + 1);
											}
											sendEmail(
												r.email,
												`${request.event} team request approved`,
												`Your request to join ${members}'s team for ${request.event} has been approved.<br /><br />- JHS TSA Board<br />Please do not reply to this email; it comes from an unmonitored email address.`,
											);
											confetti();
											yay.play();
											navigator.vibrate(100);
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
										on:click={async () => {
											const event = signedUpEvents.find(
												(e) => e.event === request.event,
											)?.teams;
											const teamUserIsIn = event?.find(
												(t) =>
													t.members
														.map((u) => u.email.toLowerCase())
														.includes($user?.email?.toLowerCase() ?? '') &&
													!t.locked,
											) ?? {
												members: [],
												requests: [],
												lastUpdatedBy: '',
												lastUpdatedTime: new Timestamp(0, 0),
											};

											teamUserIsIn.requests = teamUserIsIn.requests?.filter(
												(u) => u.email !== r.email,
											);
											teamUserIsIn.lastUpdatedBy = $user?.email ?? '';
											teamUserIsIn.lastUpdatedTime = new Timestamp(
												Date.now() / 1000,
												0,
											);
											let members = teamUserIsIn.members
												.map((m) => m.name)
												.join(', ');
											const lastComma = members.lastIndexOf(',');
											if (lastComma !== -1) {
												members =
													members.slice(0, lastComma) +
													' and' +
													members.slice(lastComma + 1);
											}

											sendEmail(
												r.email,
												`${request.event} team request denied`,
												`Your request to join ${members}'s team for ${request.event} has been denied. Please contact them for more information.<br /><br />- JHS TSA Board<br />Please do not reply to this email; it comes from an unmonitored email address.`,
											);
											await setDoc(
												doc(db, 'events', request.event ?? ''),
												{
													teams: event,
													lastUpdatedBy: $user?.email ?? '',
												},
												{
													merge: true,
												},
											);
											aww.play();
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
			class="prose max-w-full dark:prose-invert dark:text-white"
			bind:this={alertEl}
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html md.render(
				$settings.alert
					.replaceAll(
						'{{washingtonId}}',
						$userDoc?.washingtonId?.toString() ?? '',
					)
					.replaceAll('{{nationalId}}', $userDoc?.nationalId?.toString() ?? '')
					.replaceAll('{{firstName}}', $userDoc?.firstName ?? '')
					.replaceAll('{{lastName}}', $userDoc?.lastName ?? ''),
			)}
		</div>
	{/if}

	<h3 class="my-4 w-full scroll-m-20 text-2xl font-semibold tracking-tight">
		Teams
	</h3>

	{#if !signedUpEvents || signedUpEvents.length === 0}
		<p class="mt-4 w-full">
			You haven't signed up for any events yet. Please add some events on the <a
				href="/events">event sign up page.</a
			>
		</p>
	{:else}
		{#if signedUpEvents.length < 4}
			<p class="mt-4 w-full">
				You haven't signed up for enough events yet. Please add some more events
				on the <a href="/events">event sign up page.</a>
			</p>
		{/if}

		<div
			class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:items-start xl:grid-cols-3"
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
