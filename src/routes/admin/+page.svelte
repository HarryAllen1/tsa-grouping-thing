<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, db, events, memberData } from '$lib';
	import { Button } from '$lib/components/button';
	import * as Card from '$lib/components/card';
	import Checkbox from '$lib/components/checkbox/checkbox.svelte';
	import * as Dialog from '$lib/components/dialog';
	import Label from '$lib/components/label/label.svelte';
	import * as Select from '$lib/components/select';
	import * as Tooltip from '$lib/components/tooltip';
	import { correctTeamsDataType } from '$lib/types';
	import { signOut } from 'firebase/auth';
	import { doc, setDoc, type DocumentData } from 'firebase/firestore';
	import { Crown, Plus, Trash2, UserPlus } from 'lucide-svelte';
	import { Doc, userStore } from 'sveltefire';
	import { admins } from '../admins';

	const user = userStore(auth);

	if (!$user || !admins.includes($user.email?.toLowerCase() ?? '')) {
		goto('/');
	}

	let shouldHideIndividualEvents = false;
	const signedUpEvents = events;
	const selectOptions = memberData
		.map((m) => ({
			value: m.email,
			label: m.name,
		}))
		.sort((a, b) => a.label.localeCompare(b.label));

	const correctType = (eventData: DocumentData) =>
		eventData as {
			name: string;
			members: { name: string; email: string }[];
			teamCaptain?: string;
			lastUpdatedBy?: string;
		};
</script>

<div class="mt-8 flex flex-col items-center">
	<Button on:click={() => signOut(auth)}>Sign out</Button>
	<Button href="/" class="my-4">Back to regular sign up page</Button>
	<div>
		<Label>
			<Checkbox bind:checked={shouldHideIndividualEvents} />
			<span class="ml-2">Hide individual events</span>
		</Label>
	</div>
	<Select.Root>
		<Select.Trigger class="w-56 mb-4">
			<Select.Value placeholder="View by member" />
		</Select.Trigger>
		<Select.Content class="max-h-full overflow-y-scroll">
			{#each selectOptions as option}
				<Select.Item
					on:click={() => goto(`/admin/${encodeURIComponent(option.value)}`)}
					value={option.value}
					label={option.label}>{option.label}</Select.Item
				>
			{/each}
		</Select.Content>
		<Select.Input name="favoriteFruit" />
	</Select.Root>
	<div
		class="flex flex-col items-center gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:items-start"
	>
		{#each signedUpEvents as event}
			<Doc ref="events/{event.event}" let:data>
				{#if !shouldHideIndividualEvents || (shouldHideIndividualEvents && event.maxTeamSize > 1)}
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
									The team for this event will be based off of a test which you
									will take at a later date.
								</p>
							{:else}
								{#each data.teams as te}
									{@const team = correctType(te)}
									<Card.Root class="bg-blue-500 bg-opacity-20">
										<Card.Title class="m-2 ml-4 flex flex-row gap-1">
											<Button
												variant="destructive"
												on:click={async () => {
													data.teams = correctTeamsDataType(data.teams).filter(
														(t) => t !== te,
													);
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
												<Trash2 />
											</Button>
											<Dialog.Root>
												<Dialog.Trigger>
													<Button class="bg-green-500 hover:bg-green-400">
														<UserPlus />
													</Button>
												</Dialog.Trigger>

												<Dialog.Content class="max-h-full overflow-y-scroll">
													<Dialog.Title>Add People</Dialog.Title>
													<Dialog.Description>
														<p>All people not already in a team:</p>
														<ul>
															{#each memberData
																.filter((p) => !correctTeamsDataType(data.teams).find( (t) => t.members?.find((e) => e.email.toLowerCase() === p.email.toLowerCase()), ))
																.sort( (a, b) => a.name.localeCompare(b.name), ) as person}
																<li
																	class:text-green-500={memberData
																		.filter((m) =>
																			m.events.includes(event.event ?? ''),
																		)
																		.find(
																			(e) => e.email === (person?.email ?? ''),
																		)}
																	class="flex flex-row items-center"
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
																		variant="outline"
																		size="icon"
																		class="ml-2"><Plus /></Button
																	>
																</li>
															{:else}
																<li>
																	No one else singed up for this event. Teams
																	should probably be merged.
																</li>
															{/each}
														</ul>
													</Dialog.Description>
												</Dialog.Content>
											</Dialog.Root>
											<Dialog.Root>
												<Dialog.Trigger>
													<Button>Team Captain</Button>
												</Dialog.Trigger>
												<Dialog.Content>
													<Dialog.Title>Manage team captain</Dialog.Title>
													<Button
														on:click={async () => {
															const teamButMutable = team;
															teamButMutable.teamCaptain = '';
															teamButMutable.lastUpdatedBy = $user?.email ?? '';
															await setDoc(
																doc(db, 'events', event.event ?? ''),
																{
																	teams: data.teams,
																},
																{
																	merge: true,
																},
															);
														}}>Clear</Button
													>
													<ul>
														{#each team.members as teamMember}
															<!-- svelte-ignore a11y-click-events-have-key-events -->
															<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
															<li
																class="cursor-pointer"
																on:click={async () => {
																	const teamButMutable = team;
																	teamButMutable.teamCaptain =
																		teamMember?.email ?? '';
																	teamButMutable.lastUpdatedBy =
																		$user?.email ?? '';
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
																{teamMember.name}
																{#if team.teamCaptain?.toLowerCase() === teamMember.email.toLowerCase()}
																	<Tooltip.Root>
																		<Tooltip.Trigger>
																			<Crown class="h-4 w-4" />
																		</Tooltip.Trigger>
																		<Tooltip.Content
																			>Team captain</Tooltip.Content
																		>
																	</Tooltip.Root>
																{/if}
															</li>
														{/each}
													</ul>
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
															.filter((m) =>
																m.events.includes(event.event ?? ''),
															)
															.find(
																(e) =>
																	e.email.toLowerCase() ===
																	(teamMember?.email.toLowerCase() ?? ''),
															)}
														class="hover:underline hover:text-red-500 hover:cursor-pointer"
														on:click={async () => {
															const teamButMutable = team;
															teamButMutable.members.splice(
																teamButMutable.members.findIndex(
																	(e) =>
																		e.email === (teamMember?.email ?? '') &&
																		e.name === (teamMember?.name ?? ''),
																),
																1,
															);
															teamButMutable.lastUpdatedBy = $user?.email ?? '';
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
							{/if}
						</Card.Content>
						<Card.Footer>
							<Button
								on:click={async () => {
									data.teams.push({
										members: [],
										lastUpdatedBy: $user?.email ?? '',
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
				{/if}
			</Doc>
		{/each}
	</div>
</div>
