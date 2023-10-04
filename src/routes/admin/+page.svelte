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
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/alert';
	import { doc, setDoc, type DocumentData } from 'firebase/firestore';
	import { admins } from '../admins';

	const user = userStore(auth);

	if (!$user || !admins.includes($user.email ?? '')) {
		goto('/');
	}

	const signedUpEvents = events;

	const correctType = (eventData: DocumentData) =>
		eventData as { name: string; members: { name: string; email: string }[] };
</script>

<div class="mt-8 flex flex-col items-center">
	<Button on:click={() => signOut(auth)}>Sign out</Button>
	<Button href="/" class="my-4">Back to regular sign up page</Button>
	<div
		class="flex flex-col items-center gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:items-start"
	>
		{#each signedUpEvents as event}
			<Doc ref="events/{event.event}" let:data>
				<Card.Root class="w-96">
					<Card.Header>
						<Card.Title>{event.event}</Card.Title>
						<Card.Description>
							<ul>
								<li>
									Min {event.minTeamSize} people per team
								</li>
								<li>
									Max {event.maxTeamSize} people per team
								</li>
								<li>
									Max {event.perChapter} teams per chapter
								</li>
							</ul>
						</Card.Description>
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
										<Button
											variant="destructive"
											on:click={async () => {
												data.teams = data.teams.filter((t) => t !== te);
												await setDoc(
													doc(db, 'events', event.event ?? ''),
													{
														teams: data.teams
													},
													{
														merge: true
													}
												);
											}}>Delete team</Button
										>
										<Dialog.Root>
											<Dialog.Trigger>
												<Button class="bg-green-500 hover:bg-green-400">Add people</Button>
											</Dialog.Trigger>

											<Dialog.Content class="max-h-full overflow-y-scroll">
												<Dialog.Title>Add People</Dialog.Title>
												<Dialog.Description>
													<p>All people not already in team:</p>
													<ul>
														{#each memberData
															.filter((p) => !team.members.filter((t) => t.email === p.email).length)
															.sort((a, b) => a.name.localeCompare(b.name)) as person}
															<li
																class:text-green-500={memberData
																	.filter((m) => m.events.includes(event.event ?? ''))
																	.find((e) => e.email === (person?.email ?? ''))}
																class="flex flex-row items-center"
															>
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
																No one else singed up for this event. Please see a board member for
																next steps.
															</li>
														{/each}
													</ul>
												</Dialog.Description>
											</Dialog.Content>
										</Dialog.Root>
									</Card.Title>
									<Card.Content>
										<ul>
											{#each team.members as teamMember}
												<!-- svelte-ignore a11y-click-events-have-key-events -->
												<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
												<li
													class:text-green-500={memberData
														.filter((m) => m.events.includes(event.event ?? ''))
														.find((e) => e.email === (teamMember?.email ?? ''))}
													class="hover:underline hover:text-red-500 hover:cursor-pointer"
													on:click={async () => {
														const members = team.members;
														members.splice(
															members.findIndex(
																(e) =>
																	e.email === (teamMember?.email ?? '') &&
																	e.name === (teamMember?.name ?? '')
															),
															1
														);
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
													{teamMember.name}
												</li>
											{/each}
										</ul>
									</Card.Content>
								</Card.Root>
							{/each}
						{/if}
					</Card.Content>
					<Card.Footer>
						<Button
							on:click={async () => {
								data.teams.push({
									members: []
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
</div>
