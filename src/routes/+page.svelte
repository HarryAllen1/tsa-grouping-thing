<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, db, events, memberData } from '$lib';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/alert';
	import { Button } from '$lib/components/button';
	import * as Card from '$lib/components/card';
	import * as Dialog from '$lib/components/dialog';
	import * as Tooltip from '$lib/components/tooltip';
	import { signOut } from 'firebase/auth';
	import { doc, setDoc, type DocumentData } from 'firebase/firestore';
	import { LogOut, Plus, UserPlus } from 'lucide-svelte';
	import { Doc, userStore } from 'sveltefire';
	import { admins } from './admins';
	import { correctTeamsDataType } from '../lib/types';

	const user = userStore(auth);

	if (!$user) goto('/login');

	const signedUpEvents = memberData
		.find((m) => m.email.toLowerCase() === $user?.email)
		?.events.map((e) => ({
			...events.find((ev) => ev.event === e),
		}))
		.filter((e) => (e.maxTeamSize ?? 999) > 1);

	const correctType = (eventData: DocumentData) =>
		eventData as { name: string; members: { name: string; email: string }[] };
</script>

<div class="mt-8 flex flex-col items-center">
	<Button on:click={() => signOut(auth)}>Sign out</Button>
	<div class="w-full">
		<h2 class="font-bold text-xl">User info</h2>
		<p>
			Name: {$user?.displayName}
		</p>
		<p>
			Email: {$user?.email}
		</p>
		{#if !$user?.email || !$user?.displayName}
			<p>
				Something went wrong. Try refreshing the page, then logging out. If it
				still doesn't work, contact Harry on Teams or <a
					href="mailto:s-hallen@lwsd.org">by email</a
				>
			</p>
		{/if}
		{#if admins.includes($user?.email ?? '')}
			<Button href="/admin"
				>Admin page (this button is only visible to admins)</Button
			>
		{/if}
	</div>

	{#if !signedUpEvents || signedUpEvents.length === 0}
		<p class="mt-4 w-full">
			You haven't signed up for any events yet. Please see a board member or
			advisor.
		</p>
	{:else}
		<Alert variant="destructive" class="mt-4 dark:brightness-200">
			<AlertTitle>This list only includes team events.</AlertTitle>
			<AlertDescription>Individual events are not in this list</AlertDescription
			>
		</Alert>
		<p class="my-4 w-full">You have signed up for the following team events:</p>
		<div
			class="flex flex-col items-center gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:items-start"
		>
			{#each signedUpEvents as event}
				<Doc ref="events/{event.event}" let:data>
					<Card.Root class="w-96">
						<Card.Header>
							<Card.Title>{event.event}</Card.Title>
							<Card.Description
								>Max {event.maxTeamSize} people per team</Card.Description
							>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							{#if event.event === 'Technology Bowl'}
								<p>
									The team for this event will be based off of a written test
									which you will take during the meeting on 12 October
								</p>
							{:else}
								{#each data.teams as te}
									{@const team = correctType(te)}
									<Card.Root class="bg-blue-500 bg-opacity-20">
										<Card.Title class="m-2 ml-4 flex flex-row gap-1">
											{#if team.members?.find((e) => e.email.toLowerCase() === ($user?.email ?? ''))}
												<Tooltip.Root>
													<Tooltip.Trigger>
														<Button
															variant="destructive"
															on:click={async () => {
																const members = team.members;
																members.splice(
																	members.findIndex(
																		(e) =>
																			e.email.toLowerCase() ===
																			($user?.email ?? ''),
																	),
																	1,
																);
																await setDoc(
																	doc(db, 'events', event.event ?? ''),
																	{
																		teams: data.teams.filter(
																			// @ts-ignore
																			(t) => t.members.length > 0,
																		),
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
																	{#each memberData
																		.filter((m) => m.events.includes(event.event ?? '') && !correctTeamsDataType(data.teams).find( (t) => t.members?.find((e) => e.email.toLowerCase() === m.email.toLowerCase()), ))
																		.sort( (a, b) => a.name.localeCompare(b.name), ) as person}
																		<li class="flex flex-row items-center">
																			{person.name}
																			<Button
																				on:click={async () => {
																					const members = team.members;
																					members.push({
																						name: person.name,
																						email: person.email,
																					});
																					await setDoc(
																						doc(
																							db,
																							'events',
																							event.event ?? '',
																						),
																						{
																							teams: data.teams,
																						},
																						{
																							merge: true,
																						},
																					);
																				}}
																				variant="outline"
																				size="icon"
																				class="ml-2"><Plus /></Button
																			>
																		</li>
																	{:else}
																		<li>
																			No one else singed up for this event.
																			Please see a board member for next steps.
																		</li>
																	{/each}
																</ul>
															{/if}
														</Dialog.Description>
													</Dialog.Content>
												</Dialog.Root>
												<Button class="my-0">Become Team Captain</Button>
											{:else}
												<p>
													Ask someone in this team to add you if you want to
													join this team!
												</p>
											{/if}
										</Card.Title>
										<Card.Content>
											<ul>
												{#each team.members as teamMember}
													<li>{teamMember.name}</li>
												{/each}
											</ul>
										</Card.Content>
									</Card.Root>
								{/each}
							{/if}
						</Card.Content>
						<Card.Footer>
							<Button
								disabled={!!(
									correctTeamsDataType(data.teams).find((t) =>
										t.members.find(
											(e) => e.email.toLowerCase() === ($user?.email ?? ''),
										),
									) || event.event === 'Technology Bowl'
								)}
								on:click={async () => {
									data.teams.push({
										members: [
											{
												name: $user?.displayName ?? '',
												email: $user?.email ?? '',
											},
										],
									});
									await setDoc(
										doc(db, 'events', event.event ?? ''),
										{
											teams: data.teams,
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
					</Card.Root>
				</Doc>
			{/each}
		</div>
	{/if}
</div>
