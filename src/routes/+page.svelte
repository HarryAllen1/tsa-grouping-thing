<script lang="ts">
	import {
		SimpleTooltip,
		StorageMetadata,
		allUsersCollection,
		aww,
		clash,
		congratulations,
		db,
		eventsCollection,
		fancyConfirm,
		md,
		sendEmail,
		storage,
		user,
		userDoc,
		yay,
		type EventDoc,
	} from '$lib';
	import { Alert, AlertTitle } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsable from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { localStorageStore } from '$lib/components/ui/light-switch/local-storage-store';
	import { Progress } from '$lib/components/ui/progress';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Switch } from '$lib/components/ui/switch';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import confetti from 'canvas-confetti';
	import { Timestamp, doc, setDoc } from 'firebase/firestore';
	import { deleteObject, listAll, ref } from 'firebase/storage';
	import {
		ChevronsUpDown,
		Crown,
		LogOut,
		Minus,
		Plus,
		UserPlus,
		X,
	} from 'lucide-svelte';
	import { flip } from 'svelte/animate';
	import { writable } from 'svelte/store';
	import { DownloadURL, StorageList, UploadTask } from 'sveltefire';

	const yellowMode = localStorageStore('yellowMode', false);

	$: if ($yellowMode) {
		document.body.classList.add('yellow');
	} else {
		document.body.classList.remove('yellow');
	}

	$: signedUpEvents = (
		$eventsCollection.length
			? ($userDoc?.events ?? [])
					.map((e) => ({
						...$eventsCollection.find((ev) => ev.event === e),
					}))
					.sort((a, b) => a.event!.localeCompare(b.event!))
			: []
	) as EventDoc[];
	$: eventData = $eventsCollection.length
		? $eventsCollection
				.map((e) => ({
					...e,
					members: (
						$allUsersCollection?.filter((m) => m.events.includes(e.event)) ?? []
					).map((m) => ({
						name: m.name,
						email: m.email,
					})),
				}))
				.sort((a, b) => a.event.localeCompare(b.event))
		: [];

	$: requests = signedUpEvents
		.filter(
			(e) => e.teams.filter((t) => t.requests?.length).length && !e.locked,
		)
		.map((e) => ({
			event: e.event,
			team: e.teams.filter(
				(t) =>
					t.requests?.length &&
					!t.locked &&
					!e.locked &&
					t.members
						.map((u) => u.email.toLowerCase())
						.includes($user?.email?.toLowerCase() ?? ''),
			)[0],
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
		}));

	let submissionsFileUpload: HTMLInputElement;
	const filesToUpload = writable<File[]>([]);

	let dummyVariableToRerender = 0;
	const updateStorageList = () => {
		dummyVariableToRerender++;
		yay.play();
		return '';
	};
	const filterSubmissions = (submission: File) => {
		$filesToUpload = $filesToUpload.filter((f) => f !== submission);
		return '';
	};
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
				<Collapsable.Root>
					<Collapsable.Trigger asChild let:builder>
						<Button
							builders={[builder]}
							variant="ghost"
							size="sm"
							class="flex w-full items-center p-2 font-bold"
						>
							{request.event}
							<div class="flex-1" />
							<ChevronsUpDown />
						</Button>
					</Collapsable.Trigger>
					<Collapsable.Content class="px-2">
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
												actualEvent.teams.find(
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
					</Collapsable.Content>
				</Collapsable.Root>
			{/each}
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
				<Card.Root>
					<Card.Header>
						<Card.Title>
							{event.event}
						</Card.Title>
						<Card.Description>
							<ul>
								<li>
									Min {event.minTeamSize} people per team
								</li>
								<li>
									Max {event.maxTeamSize} people per team
								</li>
								<li class:text-red-500={event.teams.length > event.perChapter}>
									Max {event.perChapter} teams per chapter (currently {event
										.teams.length})
								</li>
								<li>
									{event.teams.reduce(
										(acc, curr) => acc + curr.members.length,
										0,
									)}/{eventData.find((e) => e.event === event.event)?.members
										.length ?? 0} people joined teams
								</li>
							</ul>
						</Card.Description>
					</Card.Header>
					<Card.Content class="flex flex-col gap-4">
						{#if event.locked}
							<p>
								This event is locked, likely due to eliminations. If this
								doesn't seem correct, contact a board member.
							</p>
						{/if}
						{#each event.teams as team (team.id)}
							<Card.Root class="bg-blue-500 bg-opacity-20">
								<Card.Header>
									<Card.Title>Team #{team.teamNumber}</Card.Title>
									<div class="flex flex-col gap-1 lg:flex-row">
										{#if team.locked}
											<p>
												This team is currently locked from editing. This likely
												due to eliminations. If this is unexpected, or you want
												to change something, contact a board member.
											</p>
										{:else if team.members?.find((e) => e.email.toLowerCase() === ($user?.email ?? ''))}
											<div class="flex flex-col gap-2">
												<div class="flex w-full flex-row gap-2">
													<Tooltip.Root>
														<Tooltip.Trigger>
															<Button
																variant="destructive"
																on:click={async () => {
																	const teamButMutable = team;
																	teamButMutable.members.splice(
																		teamButMutable.members.findIndex(
																			(e) =>
																				e.email.toLowerCase() ===
																				($user?.email ?? ''),
																		),
																		1,
																	);
																	teamButMutable.lastUpdatedBy =
																		$user?.email ?? '';
																	teamButMutable.lastUpdatedTime =
																		new Timestamp(Date.now() / 1000, 0);
																	await setDoc(
																		doc(db, 'events', event.event ?? ''),
																		{
																			teams: event.teams.filter(
																				(t) => t.members.length > 0,
																			),
																			lastUpdatedBy: $user?.email ?? '',
																		},
																		{
																			merge: true,
																		},
																	);
																	for (const submission of event.onlineSubmissions
																		? await listAll(
																				ref(
																					storage,
																					`submissions/${event.event}/${team.id}`,
																				),
																		  ).then((r) => r.items)
																		: []) {
																		await deleteObject(submission);
																	}
																	aww.play();
																}}
															>
																<LogOut />
															</Button>
														</Tooltip.Trigger>
														<Tooltip.Content>Leave team</Tooltip.Content>
													</Tooltip.Root>
													<Dialog.Root>
														{#if team.members.length >= (event.maxTeamSize ?? 9999)}
															<Tooltip.Root>
																<Tooltip.Trigger>
																	<Dialog.Trigger disabled>
																		<Button
																			class="bg-green-500 hover:bg-green-400"
																			disabled
																		>
																			<UserPlus />
																		</Button>
																	</Dialog.Trigger>
																</Tooltip.Trigger>
																<Tooltip.Content>
																	<p>Team is full</p>
																</Tooltip.Content>
															</Tooltip.Root>
														{:else}
															<Dialog.Trigger>
																<Tooltip.Root>
																	<Tooltip.Trigger>
																		<Button
																			class="bg-green-500 hover:bg-green-400"
																		>
																			<UserPlus />
																		</Button>
																	</Tooltip.Trigger>
																	<Tooltip.Content>Add person</Tooltip.Content>
																</Tooltip.Root>
															</Dialog.Trigger>
														{/if}

														<Dialog.Content>
															<Dialog.Title>Add People</Dialog.Title>
															<Dialog.Description>
																{#if team.members.length >= (event.maxTeamSize ?? 9999)}
																	<Alert class="dark:brightness-200">
																		<AlertTitle>This team is full</AlertTitle>
																	</Alert>
																{:else}
																	<p>People who signed up for this event:</p>
																	<ul>
																		{#each $allUsersCollection
																			.filter((m) => m.events.includes(event.event ?? '') && !event.teams.find( (t) => t.members?.find((e) => e.email.toLowerCase() === m.email.toLowerCase()), ) && !event.teams.find( (t) => t.requests?.find((e) => e.email.toLowerCase() === m.email.toLowerCase()), ))
																			.sort( (a, b) => a.name.localeCompare(b.name), ) as person (person.email)}
																			<li
																				class="flex flex-row items-center"
																				animate:flip={{
																					duration: 200,
																				}}
																			>
																				{person.name}
																				<Button
																					on:click={async () => {
																						const teamButMutable = team;
																						teamButMutable.members.push({
																							name: person.name,
																							email: person.email,
																						});
																						teamButMutable.lastUpdatedBy =
																							$user?.email ?? '';
																						teamButMutable.lastUpdatedTime =
																							new Timestamp(
																								Date.now() / 1000,
																								0,
																							);
																						await setDoc(
																							doc(
																								db,
																								'events',
																								event.event ?? '',
																							),
																							{
																								teams: event.teams,
																								lastUpdatedBy:
																									$user?.email ?? '',
																							},
																							{
																								merge: true,
																							},
																						);
																						confetti();
																						navigator.vibrate(100);
																						yay.play();
																					}}
																					variant="outline"
																					size="icon"
																					class="ml-2"
																				>
																					<Plus />
																				</Button>
																			</li>
																		{:else}
																			<li>
																				No one else singed up for this event.
																				Please see a board member for next
																				steps.
																			</li>
																		{/each}
																	</ul>
																{/if}
															</Dialog.Description>
														</Dialog.Content>
													</Dialog.Root>
												</div>
												<div class="flex w-full flex-row gap-2">
													<Button
														on:click={async () => {
															const teamButMutable = team;
															teamButMutable.teamCaptain = $user?.email ?? '';
															teamButMutable.lastUpdatedBy = $user?.email ?? '';
															teamButMutable.lastUpdatedTime = new Timestamp(
																Date.now() / 1000,
																0,
															);
															await setDoc(
																doc(db, 'events', event.event ?? ''),
																{
																	teams: event.teams,
																	lastUpdatedBy: $user?.email ?? '',
																},
																{
																	merge: true,
																},
															);
															congratulations.play();
														}}
														disabled={team.teamCaptain === $user?.email}
														class="w-fit"
													>
														Become Team Captain
													</Button>
												</div>
												{#if event.onlineSubmissions}
													<div>
														<Dialog.Root
															onOpenChange={(e) => {
																if (e) clash.play();
															}}
															closeOnOutsideClick={false}
														>
															<Dialog.Trigger>
																<Button>Manage Submissions</Button>
															</Dialog.Trigger>
															<Dialog.Content>
																<Dialog.Header>
																	<Dialog.Title>Manage Submissions</Dialog.Title
																	>
																</Dialog.Header>
																{#if event.submissionDescription}
																	<div
																		class="prose dark:prose-invert dark:text-white"
																	>
																		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
																		{@html md.render(
																			`## What needs to be submitted:\n\n${event.submissionDescription}`,
																		)}
																	</div>
																{/if}
																<p>
																	Feel free to submit extra work outside of the
																	requirements, if you want.
																</p>
																{#key dummyVariableToRerender}
																	<StorageList
																		ref="submissions/{event.event}/{team.id}"
																		let:list
																	>
																		<ul>
																			{#each [...(list?.items ?? []), ...$filesToUpload] as submission}
																				<li
																					class="flex w-full flex-col items-center"
																				>
																					{#if submission instanceof File}
																						<UploadTask
																							ref="submissions/{event.event}/{team.id}/{submission.name}"
																							data={submission}
																							let:snapshot
																							let:progress
																						>
																							{#if snapshot?.state === 'success'}
																								{filterSubmissions(submission)}
																								{updateStorageList()}
																							{:else}
																								<Progress
																									value={progress}
																									class="w-full"
																								/>

																								<span class="w-full">
																									{submission.name}
																								</span>
																							{/if}
																						</UploadTask>
																					{:else}
																						<div
																							class="flex w-full flex-row items-center"
																						>
																							<DownloadURL
																								ref={submission}
																								let:link
																							>
																								<StorageMetadata
																									let:meta
																									ref={submission}
																								>
																									<SimpleTooltip
																										message={new Date(
																											meta.timeCreated,
																										).toLocaleString()}
																									>
																										<a
																											href={link}
																											target="_blank"
																										>
																											{submission.name}
																										</a>
																									</SimpleTooltip>
																								</StorageMetadata>
																							</DownloadURL>
																							<div class="flex flex-grow" />
																							<Button
																								variant="ghost"
																								size="icon"
																								on:click={async () => {
																									if (
																										submission instanceof File
																									)
																										return;
																									await deleteObject(
																										submission,
																									);
																									aww.play();
																									team.lastUpdatedBy =
																										$user?.email ?? '';
																									dummyVariableToRerender++;
																								}}
																							>
																								<X />
																							</Button>
																						</div>
																					{/if}
																				</li>
																			{:else}
																				<p>No submissions</p>
																			{/each}
																		</ul>
																		<Button
																			class="mt-4"
																			on:click={() =>
																				submissionsFileUpload.click()}
																		>
																			Upload
																		</Button>
																		<input
																			bind:this={submissionsFileUpload}
																			on:change={(e) => {
																				if (
																					e.target instanceof HTMLInputElement
																				) {
																					if (!e.target.files?.length) return;
																					const files = [...e.target.files];
																					for (const file of files) {
																						if (file.size > 250 * 1024 * 1024) {
																							alert(
																								`File ${file.name} is too large.`,
																							);
																							continue;
																						}
																						if (
																							list?.items
																								.map((f) => f.name)
																								.includes(file.name)
																						) {
																							alert(
																								`File ${file.name} already exists. If you want to upload this file, change the name.`,
																							);
																							continue;
																						}

																						$filesToUpload.push(file);
																						$filesToUpload = $filesToUpload;
																					}
																					yay.play();
																					confetti();
																				}
																			}}
																			class="hidden"
																			type="file"
																			multiple
																			accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.ppt,.pptx"
																		/>
																	</StorageList>
																{/key}

																<p>
																	Allowed file types: all image files, all audio
																	files, all video files, pdfs, plain text
																	files, PowerPoints (.ppt, .pptx), and Word
																	docs (.doc, .docx).
																</p>
																<p>250MB max file size.</p>
																<p>
																	If you need to submit a file type not listed,
																	or need to upload a file larger than 250MB,
																	please contact Harry (<a
																		href="mailto:s-hallen@lwsd.org"
																		>s-hallen@lwsd.org</a
																	>).
																</p>
															</Dialog.Content>
														</Dialog.Root>
													</div>
												{/if}
											</div>
										{:else if !event.locked && !(event.teams.find( (t) => t.members.find((e) => e.email.toLowerCase() === ($user?.email ?? '')), ) || event.event === 'Technology Bowl') && team.members.length < event.maxTeamSize}
											{#if team.requests?.find((u) => u.email === $user?.email)}
												<Button disabled>Requested</Button>
											{:else}
												<Button
													on:click={async () => {
														await setDoc(
															doc(db, 'events', event.event ?? ''),
															{
																teams: event.teams.map((t) => {
																	if (t === team) {
																		t.requests = t.requests ?? [];
																		t.requests.push({
																			name: $user?.displayName ?? '',
																			email: $user?.email ?? '',
																		});
																	}
																	return t;
																}),
																lastUpdatedBy: $user?.email ?? '',
															},
															{
																merge: true,
															},
														);
														sendEmail(
															team.members.map((m) => m.email),
															'New team request',
															`${
																$user?.displayName ?? 'Someone'
															} has requested to join your team for ${
																event.event
															}. Please go to the <a href="https://tsa-grouping-thing.vercel.app">team creation wizard</a> to accept or deny the request.<br /><br />- JHS TSA Board<br />Please do not reply to this email; it comes from an unmonitored email address.`,
														);
														fancyConfirm(
															'Request sent',
															"A email has also been sent to the members of this team notifying them of your request. This email has a habit of going straight to people's junk folder, so you might have to notify them of this request manually.",
															[['OK', true]],
														);
													}}
												>
													Request to join
												</Button>
											{/if}
										{/if}
									</div>
								</Card.Header>
								<Card.Content>
									{#if team.requests?.length && !event.locked && !team.locked && team.members
											.map((u) => u.email.toLowerCase())
											.includes($user?.email?.toLowerCase() ?? '')}
										<div class="mb-4">
											<Collapsable.Root>
												<Collapsable.Trigger asChild let:builder>
													<Button
														builders={[builder]}
														variant="ghost"
														size="sm"
														class="flex w-full items-center p-2"
													>
														Manage Requests
														<div class="flex-1" />
														<ChevronsUpDown />
													</Button>
												</Collapsable.Trigger>
												<Collapsable.Content class="px-2">
													<ul>
														{#each team.requests ?? [] as request}
															<li class="flex flex-row">
																{request.name}
																<Button
																	on:click={async () => {
																		team.members.push({
																			name: request.name,
																			email: request.email,
																		});
																		team.lastUpdatedBy = $user?.email ?? '';
																		team.lastUpdatedTime = new Timestamp(
																			Date.now() / 1000,
																			0,
																		);
																		team.requests = team.requests?.filter(
																			(r) =>
																				r.email !== request.email &&
																				r.name !== request.name,
																		);
																		await setDoc(
																			doc(db, 'events', event.event ?? ''),
																			{
																				teams: event.teams,
																				lastUpdatedBy: $user?.email ?? '',
																			},
																			{
																				merge: true,
																			},
																		);

																		let members = team.members
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
																			request.email,
																			`${event.event} team request approved`,
																			`Your request to join ${members}'s team for ${event.event} has been approved.<br /><br />- JHS TSA Board<br />Please do not reply to this email; it comes from an unmonitored email address.`,
																		);
																		confetti();
																		navigator.vibrate(100);
																		yay.play();
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
																		team.requests = team.requests?.filter(
																			(r) =>
																				r.email !== request.email &&
																				r.name !== request.name,
																		);
																		team.lastUpdatedBy = $user?.email ?? '';
																		team.lastUpdatedTime = new Timestamp(
																			Date.now() / 1000,
																			0,
																		);
																		let members = team.members
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
																			request.email,
																			`${event.event} team request denied`,
																			`Your request to join ${members}'s team for ${event.event} has been denied. Please contact them for more information.<br /><br />- JHS TSA Board<br />Please do not reply to this email; it comes from an unmonitored email address.`,
																		);
																		await setDoc(
																			doc(db, 'events', event.event ?? ''),
																			{
																				teams: event.teams,
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
												</Collapsable.Content>
											</Collapsable.Root>
										</div>
									{/if}
									<ul>
										{#each team.members as teamMember (teamMember.email)}
											<li>
												{teamMember.name}
												{#if team.teamCaptain?.toLowerCase() === teamMember.email.toLowerCase()}
													<Tooltip.Root>
														<Tooltip.Trigger>
															<Crown class="h-4 w-4" />
														</Tooltip.Trigger>
														<Tooltip.Content>Team captain</Tooltip.Content>
													</Tooltip.Root>
												{/if}
											</li>
										{/each}
									</ul>
								</Card.Content>
							</Card.Root>
						{/each}
					</Card.Content>
					{#if !event.locked && !(event.teamCreationLocked && event.teams.length >= event.perChapter) && !event.teams.filter( (t) => t.requests
									?.map((r) => r.email)
									.includes($user?.email ?? ''), ).length}
						<Card.Footer>
							<Button
								disabled={!!(
									event.teams.find((t) =>
										t.members.find(
											(e) => e.email.toLowerCase() === ($user?.email ?? ''),
										),
									) || event.event === 'Technology Bowl'
								)}
								on:click={async () => {
									let lowestNotTaken = 1;
									while (
										event.teams.find((t) => t.teamNumber === lowestNotTaken)
									) {
										lowestNotTaken++;
									}

									event.teams.push({
										members: [
											{
												name: $user?.displayName ?? '',
												email: $user?.email ?? '',
											},
										],
										lastUpdatedBy: $user?.email ?? '',
										id: crypto.randomUUID(),
										teamNumber: lowestNotTaken,
									});
									await setDoc(
										doc(db, 'events', event.event ?? ''),
										{
											teams: event.teams,
											lastUpdatedBy: $user?.email ?? '',
										},
										{
											merge: true,
										},
									);
								}}
							>
								Create Team
							</Button>
						</Card.Footer>
					{/if}
				</Card.Root>
			{:else}
				<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
				{#each { length: 9 } as _}
					<Skeleton class="h-[32rem] w-full" />
				{/each}
			{/each}
		</div>
	{/if}
	<div class="mt-4 flex items-center space-x-2">
		<Switch bind:checked={$yellowMode} id="yellow" />
		<Label for="yellow">Yellow mode</Label>
	</div>
</div>
