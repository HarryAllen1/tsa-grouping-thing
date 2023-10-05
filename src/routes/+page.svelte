<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, db, events, memberData } from '$lib';
	import { Button } from '$lib/components/button';
	import { Plus } from 'lucide-svelte';
	import * as Card from '$lib/components/card';
	import { signOut } from 'firebase/auth';
	import * as Tooltip from '$lib/components/tooltip';
	import * as Dialog from '$lib/components/dialog';
	import { Doc, userStore } from 'sveltefire';
	import Alert from '../lib/components/alert/alert.svelte';
	import AlertTitle from '../lib/components/alert/alert-title.svelte';
	import AlertDescription from '../lib/components/alert/alert-description.svelte';
	import { doc, setDoc, type DocumentData } from 'firebase/firestore';

	const user = userStore(auth);

	if (!$user) goto('/login');

	const signedUpEvents = memberData
		.find((m) => m.email === auth.currentUser?.email)
		?.events.map((e) => ({
			...events.find((ev) => ev.event === e)
		}));

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
	</div>

	{#if !signedUpEvents || signedUpEvents.length === 0}
		<p class="mt-4 w-full">
			You haven't signed up for any events yet. Please see a board member or advisor.
		</p>
	{:else}
		<Alert variant="destructive" class="mt-4 dark:brightness-200">
			<AlertTitle>This list only includes team events.</AlertTitle>
			<AlertDescription>Individual events are not in this list</AlertDescription>
		</Alert>
		<p class="my-4 w-full">You have signed up for the following team events:</p>
		<div class="flex flex-col items-center gap-4">
			{#each signedUpEvents as event}
				<Doc ref="events/{event.event}" let:data>
					<Card.Root class="w-96">
						<Card.Header>
							<Card.Title>{event.event}</Card.Title>
							<Card.Description>Max {event.maxTeamSize} people per team</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							{#if event.event === 'Technology Bowl'}
								<p>
									The team for this event will be based off of a test which you will take at a later
									date.
								</p>
							{:else}
								{#each data.teams as te}
									{@const team = correctType(te)}
									<Card.Root class="bg-blue-500 bg-opacity-20">
										<Card.Title class="m-2 ml-4">
											{#if team.members.find((e) => e.email === ($user?.email ?? '') && e.name === ($user?.displayName ?? ''))}
												<Button
													variant="destructive"
													on:click={async () => {
														const members = team.members;
														members.splice(
															members.findIndex(
																(e) =>
																	e.email === ($user?.email ?? '') &&
																	e.name === ($user?.displayName ?? '')
															),
															1
														);
														await setDoc(
															doc(db, 'events', event.event ?? ''),
															{
																teams: data.teams.filter(
																	// @ts-ignore
																	(t) => t.members.length > 0
																)
															},
															{
																merge: true
															}
														);
													}}>Leave</Button
												>
												<Dialog.Root>
													<Tooltip.Root>
														<Tooltip.Trigger>
															<Dialog.Trigger
																disabled={team.members.length >= (event.maxTeamSize ?? 9999)}
															>
																<Button
																	class="bg-green-500 hover:bg-green-400"
																	disabled={team.members.length >= (event.maxTeamSize ?? 9999)}
																	>Add people</Button
																>
															</Dialog.Trigger>
														</Tooltip.Trigger>
														<Tooltip.Content>
															<p>Team is full</p>
														</Tooltip.Content>
													</Tooltip.Root>

													<Dialog.Content>
														<Dialog.Title>Add People</Dialog.Title>
														<Dialog.Description>
															{#if team.members.length >= (event.maxTeamSize ?? 9999)}
																<Alert variant="destructive" class="dark:brightness-200">
																	<AlertTitle>Error</AlertTitle>
																	<AlertDescription>This team is full</AlertDescription>
																</Alert>
															{:else}
																<p>People who signed up for this event:</p>
																<ul>
																	{#each memberData.filter((m) => m.events.includes(event.event ?? '') && !data.teams.find( (// @ts-ignore
																					t) => t.members.find((e) => e.email === m.email) )) as person}
																		<li class="flex flex-row items-center">
																			{person.name}
																			<Button
																				on:click={async () => {
																					const members = team.members;
																					members.push({
																						name: person.name,
																						email: person.email
																					});
																					await setDoc(
																						doc(db, 'events', event.event ?? ''),
																						{
																							teams: data.teams
																						},
																						{
																							merge: true
																						}
																					);
																				}}
																				variant="outline"
																				size="icon"
																				class="ml-2"><Plus /></Button
																			>
																		</li>
																	{:else}
																		<li>
																			No one else singed up for this event. Please see a board
																			member for next steps.
																		</li>
																	{/each}
																</ul>
															{/if}
														</Dialog.Description>
													</Dialog.Content>
												</Dialog.Root>
											{:else}
												<p>
													Ask someone in this team to add you if you want to join this team (you
													must have signed up for this event)!
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
								disabled={// @ts-ignore
								data.teams.find((t) =>
									t.members.find(
										// @ts-ignore
										(e) => e.email === ($user?.email ?? '') && e.name === ($user?.displayName ?? '')
									)
								) || event.event === 'Technology Bowl'}
								on:click={async () => {
									data.teams.push({
										members: [
											{
												name: $user?.displayName ?? '',
												email: $user?.email ?? ''
											}
										]
									});
									await setDoc(
										doc(db, 'events', event.event ?? ''),
										{
											teams: data.teams
										},
										{
											merge: true
										}
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
