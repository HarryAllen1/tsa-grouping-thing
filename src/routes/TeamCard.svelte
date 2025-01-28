<script lang="ts">
	import { fancyConfirm } from '$lib/FancyConfirm.svelte';
	import SimpleTooltip from '$lib/SimpleTooltip.svelte';
	import StorageMetadata from '$lib/StorageMetadata.svelte';
	import { Alert, AlertTitle } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Progress } from '$lib/components/ui/progress';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { POINT_OF_CONTACT_EMAIL } from '$lib/constants';
	import { analytics, db, sendEmail } from '$lib/firebase';
	import { md } from '$lib/md';
	import { allUsersCollection, user, userDoc } from '$lib/stores';
	import type { EventDoc, Team, UserDoc } from '$lib/types';
	import confetti from 'canvas-confetti';
	import { logEvent } from 'firebase/analytics';
	import { Timestamp, doc, setDoc } from 'firebase/firestore';
	import {
		deleteObject,
		getDownloadURL,
		type FullMetadata,
	} from 'firebase/storage';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import Crown from 'lucide-svelte/icons/crown';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Minus from 'lucide-svelte/icons/minus';
	import Plus from 'lucide-svelte/icons/plus';
	import UserPlus from 'lucide-svelte/icons/user-plus';
	import X from 'lucide-svelte/icons/x';
	import type { Snippet } from 'svelte';
	import { flip } from 'svelte/animate';
	import { DownloadURL, StorageList, UploadTask } from 'sveltefire';
	import CardboardBoatDialog from './CardboardBoatDialog.svelte';
	import CheckInDialog from './CheckInDialog.svelte';

	let {
		event,
		team,
	}: {
		event: EventDoc;
		team: Team;
	} = $props();

	let submissionsFileUpload = $state<HTMLInputElement>();
	let filesToUpload = $state<File[]>([]);

	let dummyVariableToRerender = $state(0);
	const updateStorageList = () => {
		dummyVariableToRerender++;

		return '';
	};
	const filterSubmissions = (submission: File) => {
		filesToUpload = filesToUpload.filter((f) => f !== submission);
		return '';
	};

	const getPeopleWhoCanBeAddedToEvent = (
		event: EventDoc,
		allUsers: UserDoc[],
	) =>
		allUsers
			.filter(
				(m) =>
					// signed up for event and also include gender check
					// DO NOT CHANGE TO `!event.allowGenderMixing`
					(event.allowGenderMixing === false
						? (m.gender === $userDoc?.gender && m.events.length > 0) ||
							(m.gender === 'Non-Binary' && m.events.length > 0)
						: event.showToEveryone
							? m.events.length
							: m.events.includes(event.event ?? '')) &&
					// not already in team
					!event.teams.some((t) =>
						t.members?.find(
							(e) => e.email.toLowerCase() === m.email.toLowerCase(),
						),
					) &&
					// didn't request to be part of another team
					!event.teams.some((t) =>
						t.requests?.find(
							(e) => e.email.toLowerCase() === m.email.toLowerCase(),
						),
					),
			)
			.sort((a, b) => a.name.localeCompare(b.name));
</script>

<Card.Root
	class={team.members.length > event.maxTeamSize ||
	team.members.length < event.minTeamSize
		? 'bg-red-300/20 dark:bg-red-950'
		: 'bg-black/5 dark:bg-white/5'}
>
	<Card.Header>
		<Card.Title class="flex flex-row items-center">
			<span>
				{#if event.event === '*Rooming'}
					Room #{team.teamNumber}
				{:else if event.event === '*Cardboard Boat'}
					{team.teamName || '(no team name)'}
				{:else if event.maxTeamSize === 1 && team.members.length === 1}
					Individual Event
				{:else}
					Team 2082-{team.teamNumber}
				{/if}
			</span>
			{#if event.event === '*Cardboard Boat' && !team.locked && !event.locked && team.members.find((e) => e.email.toLowerCase() === ($user?.email ?? ''))}
				<CardboardBoatDialog teamId={team.id} {event} />
			{/if}
		</Card.Title>
		<div class="flex flex-col gap-1 lg:flex-row">
			{#if team.locked || event.locked}
				<p>This team is currently locked from editing.</p>
			{:else if team.members?.find((e) => e.email.toLowerCase() === ($user?.email ?? ''))}
				<div class="flex flex-col gap-2">
					<div class="flex w-full flex-row gap-2">
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Button
									variant="destructive"
									onclick={async () => {
										team.members.splice(
											team.members.findIndex(
												(e) => e.email.toLowerCase() === ($user?.email ?? ''),
											),
											1,
										);
										team.lastUpdatedBy = $user?.email ?? '';
										team.lastUpdatedTime = new Timestamp(Date.now() / 1000, 0);
										await setDoc(
											doc(db, 'events', event.event ?? ''),
											{
												teams: event.teams.filter((t) => t.members.length > 0),
												lastUpdatedBy: $user?.email ?? '',
											},
											{
												merge: true,
											},
										);
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
										<Dialog.Trigger>
											{#snippet child({ props })}
												<Button
													class="bg-green-500 hover:bg-green-400"
													disabled
													{...props}
												>
													<UserPlus />
												</Button>
											{/snippet}
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
											<Button class="bg-green-500 hover:bg-green-400">
												<UserPlus />
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content>Add person</Tooltip.Content>
									</Tooltip.Root>
								</Dialog.Trigger>
							{/if}

							<Dialog.Content class="max-h-screen overflow-y-scroll">
								<Dialog.Title>Add People</Dialog.Title>
								{#if team.members.length >= (event.maxTeamSize ?? 9999)}
									<Alert class="dark:brightness-200">
										<AlertTitle>
											This {event.event === '*Rooming' ? 'room' : 'team'} is full</AlertTitle
										>
									</Alert>
								{:else}
									{#if event.event === '*Rooming'}
										<Alert variant="destructive" class="dark:brightness-200">
											<AlertTitle>
												You can only be in rooms with people of the same gender
												(this is district policy)
											</AlertTitle>
											If something seems wrong, contact a JHS TSA board member.
										</Alert>
									{:else}
										<Dialog.Description>
											<p>People who signed up for this event:</p>
										</Dialog.Description>
									{/if}

									<ul>
										{#each getPeopleWhoCanBeAddedToEvent(event, $allUsersCollection) as person (person.email)}
											<li
												class="flex flex-row items-center"
												animate:flip={{
													duration: 200,
												}}
											>
												{person.name}
												<Button
													onclick={async () => {
														if (team.members.length >= event.maxTeamSize) {
															return alert('Your team is full');
														}
														team.members.push({
															name: person.name,
															email: person.email,
														});
														team.lastUpdatedBy = $user?.email ?? '';
														team.lastUpdatedTime = new Timestamp(
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
														confetti();
														navigator.vibrate(100);
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
												No one else singed up for this event. Ask around to see
												if other people want to sign up for this event.
											</li>
										{/each}
									</ul>
								{/if}
							</Dialog.Content>
						</Dialog.Root>
					</div>

					{#if event.event !== '*Rooming' && event.event !== '*Cardboard Boat' && event.maxTeamSize > 1}
						<div class="flex w-full flex-row gap-2">
							<Button
								onclick={async () => {
									team.teamCaptain = $user?.email ?? '';
									team.lastUpdatedBy = $user?.email ?? '';
									team.lastUpdatedTime = new Timestamp(Date.now() / 1000, 0);
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
								disabled={team.teamCaptain === $user?.email}
								class="w-fit"
							>
								Become Team Captain
							</Button>
						</div>
					{/if}
					{#if event.onlineSubmissions}
						<div>
							<Dialog.Root>
								<Dialog.Trigger>
									<Button>Manage Submissions</Button>
								</Dialog.Trigger>
								<Dialog.Content
									interactOutsideBehavior="ignore"
									class="max-h-screen overflow-y-auto"
								>
									<Dialog.Header>
										<Dialog.Title>Manage Submissions</Dialog.Title>
									</Dialog.Header>
									{#if event.submissionDescription}
										<div class="prose dark:prose-invert dark:text-white">
											<!-- eslint-disable-next-line svelte/no-at-html-tags -->
											{@html md.render(
												`## What needs to be submitted:\n\n${event.submissionDescription}`,
											)}
										</div>
									{/if}

									{#key dummyVariableToRerender}
										<StorageList
											ref="submissions/{event.event}/{team.id}"
											let:list
										>
											<ul>
												{#each [...(list?.items ?? []), ...filesToUpload] as submission}
													<li class="flex w-full flex-col items-center">
														{#if submission instanceof File}
															<UploadTask
																metadata={{
																	customMetadata: {
																		teamId: team.id,
																		userEmail: $user?.email ?? '',
																		userName: $userDoc?.name ?? '',
																	},
																}}
																ref="submissions/{event.event}/{team.id}/{submission.name}"
																data={submission}
																let:snapshot
																let:progress
															>
																{#if snapshot?.state === 'success'}
																	{filterSubmissions(submission)}
																	{updateStorageList()}
																{:else}
																	<Progress value={progress} class="w-full" />

																	<span class="w-full">
																		{submission.name}
																	</span>
																{/if}
															</UploadTask>
														{:else}
															<div class="flex w-full flex-row items-center">
																{#snippet submissionsList(
																	link: string,
																	meta: FullMetadata,
																)}
																	<SimpleTooltip
																		message={new Date(
																			meta.timeCreated,
																		).toLocaleString()}
																	>
																		<a href={link} target="_blank">
																			{submission.name}
																		</a>
																	</SimpleTooltip>
																{/snippet}
																<DownloadURL ref={submission} let:link>
																	<StorageMetadata
																		link={link ?? ''}
																		withMetadata={submissionsList as Snippet}
																		ref={submission}
																	></StorageMetadata>
																</DownloadURL>
																<div class="flex grow"></div>
																<Button
																	variant="ghost"
																	size="icon"
																	onclick={async () => {
																		if (submission instanceof File) return;
																		await deleteObject(submission);

																		team.lastUpdatedBy = $user?.email ?? '';
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
												onclick={() => submissionsFileUpload?.click()}
											>
												Upload
											</Button>
											<input
												bind:this={submissionsFileUpload}
												onchange={(e) => {
													if (e.target instanceof HTMLInputElement) {
														if (!e.target.files?.length) return;
														const files = [
															...(e.target.files as unknown as File[]),
														];
														for (const file of files) {
															if (file.size > 250 * 1024 * 1024) {
																alert(`File ${file.name} is too large.`);
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

															filesToUpload.push(file);
														}

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
										Allowed file types: all image files, all audio files, all
										video files, pdfs, plain text files, PowerPoints (.ppt,
										.pptx), and Word docs (.doc, .docx).
									</p>
									<p>250MB max file size.</p>
									<p>
										If you need to submit a file type not listed or need to
										upload a file larger than 250MB, please contact Harry (<a
											href="mailto:{POINT_OF_CONTACT_EMAIL}"
											>{POINT_OF_CONTACT_EMAIL}</a
										>).
									</p>
								</Dialog.Content>
							</Dialog.Root>
						</div>
					{/if}
				</div>
			{:else if !event.locked && !(event.teams.some( (t) => t.members.find((e) => e.email.toLowerCase() === ($user?.email ?? '')), ) || event.event === 'Technology Bowl') && team.members.length < event.maxTeamSize}
				{#if team.requests?.find((u) => u.email === $user?.email)}
					<Button disabled>Requested</Button>
				{:else}
					<Button
						onclick={async () => {
							await setDoc(
								doc(db, 'events', event.event ?? ''),
								{
									teams: event.teams.map((t) => {
										if (t === team) {
											t.requests = t.requests ?? [];
											t.requests.push({
												name: $userDoc?.name ?? '',
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
									$userDoc.name ?? 'Someone'
								} has requested to join your team for ${
									event.event
								}. Please go to the <a href="https://teaming.jhstsa.org">team creation wizard</a> to accept or deny the request.<br /><br />- JHS TSA Board<br />Please do not reply to this email; it comes from an unmonitored email address.`,
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
		<div class="has-[*]:mb-4">
			{#if team.members
				.map((u) => u.email.toLowerCase())
				.includes($user?.email?.toLowerCase() ?? '')}
				<StorageList ref="files/{event.event}/{team.id}" let:list>
					{#if list?.items.length}
						<Collapsible.Root
							onOpenChange={(e) => {
								if (e) {
									logEvent(analytics, 'select_item', {});
								}
							}}
						>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<Button
										variant="ghost"
										size="sm"
										class="flex w-full items-center p-2"
										{...props}
									>
										Files ({list.items.length})
										<div class="flex-1"></div>
										<ChevronsUpDown />
									</Button>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content class="px-2">
								{#if list.items.length === 0}
									<p>No files</p>
								{:else}
									<ul>
										{#each list.items as file}
											<li>
												{#await getDownloadURL(file) then dlUrl}
													<a href={dlUrl} target="_blank" rel="noreferrer">
														{file.name}
													</a>
												{/await}
											</li>
										{/each}
									</ul>
								{/if}
							</Collapsible.Content>
						</Collapsible.Root>
					{/if}
				</StorageList>
				{#if team.requests?.length}
					<Collapsible.Root>
						<Collapsible.Trigger>
							{#snippet child({ props })}
								<Button
									variant="ghost"
									size="sm"
									class="flex w-full items-center p-2"
									{...props}
								>
									Manage Requests {#if team.requests?.length}
										({team.requests.filter(
											(r) =>
												!event.teams
													.filter((t) =>
														t.members.some(
															(u) =>
																u.email.toLowerCase() !==
																$user.email?.toLowerCase(),
														),
													)
													.flatMap((t) => t.members)
													.some(
														(u) =>
															u.email.toLowerCase() === r.email.toLowerCase(),
													),
										).length})
									{/if}
									<div class="flex-1"></div>
									<ChevronsUpDown />
								</Button>
							{/snippet}
						</Collapsible.Trigger>
						<Collapsible.Content class="px-2">
							<ul>
								{#each team.requests.filter((r) => !event.teams
											.filter( (t) => t.members.some((u) => u.email.toLowerCase() !== $user.email?.toLowerCase()), )
											.flatMap((t) => t.members)
											.some((u) => u.email.toLowerCase() === r.email.toLowerCase())) ?? [] as request}
									<li class="flex flex-row">
										{request.name}
										<Button
											onclick={async () => {
												if (team.members.length >= event.maxTeamSize) {
													return alert('Your team is full');
												}
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
											onclick={async () => {
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
				{/if}
			{/if}
		</div>
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
	{#if team.members.find((e) => e.email === $userDoc.email) && event.eventStatusCheckInEnabled}
		<Card.Footer>
			<CheckInDialog {event} {team} />
		</Card.Footer>
	{/if}
</Card.Root>
