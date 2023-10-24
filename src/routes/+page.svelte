<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, db, events, memberData } from '$lib';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/alert';
	import { Button } from '$lib/components/button';
	import * as Card from '$lib/components/card';
	import * as Dialog from '$lib/components/dialog';
	import * as Tooltip from '$lib/components/tooltip';
	import { signOut } from 'firebase/auth';
	import {
		doc,
		setDoc,
		type DocumentData,
		Timestamp,
	} from 'firebase/firestore';
	import { Crown, LogOut, Plus, UserPlus } from 'lucide-svelte';
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

	const individualEvents = memberData
		.find((m) => m.email.toLowerCase() === $user?.email)
		?.events.map((e) => ({ ...events.find((ev) => ev.event === e) }))
		.filter((e) => e.maxTeamSize === 1);

	const correctType = (eventData: DocumentData) =>
		eventData as {
			name: string;
			members: { name: string; email: string }[];
			teamCaptain?: string;
			lastUpdatedBy?: string;
			lastUpdatedTime?: Timestamp;
			locked?: boolean;
			[key: string]: unknown;
		};
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
			<Button href="/admin">
				Admin page (this button is only visible to admins)
			</Button>
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
			<AlertDescription>
				Individual events are not in this list, you will be automatically be
				assigned to a team with just yourself.
			</AlertDescription>
		</Alert>
		{#if individualEvents?.length}
			<div class="mt-4 w-full">
				<p>You have signed up for the following individual events:</p>
				<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
					{#each individualEvents as event}
						<li>
							{event.event}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
		<p class="my-4 w-full">You have signed up for the following team events:</p>
		<div
			class="flex flex-col items-center gap-4 lg:grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 lg:items-start"
		>
			{#each signedUpEvents as event}
				<Doc ref="events/{event.event}" let:data>
					<Card.Root class="w-96">
						<Card.Header>
							<Card.Title>
								{event.event}
							</Card.Title>
							<Card.Description>
								Max {event.maxTeamSize} people per team
							</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							{#if data.locked}
								<p>
									This event is locked, likely due to eliminations. If this
									doesn't seem correct, contact a board member.
								</p>
							{/if}
							{#each data.teams as te}
								{@const team = correctType(te)}
								<Card.Root class="bg-blue-500 bg-opacity-20">
									<Card.Title class="m-2 ml-4 flex flex-row gap-1">
										{#if !data.locked && team.locked}
											<Tooltip.Root>
												<Tooltip.Trigger>
													<p>This team is currently locked from editing.</p>
												</Tooltip.Trigger>
												<Tooltip.Content>
													This likely due to eliminations. If this is
													unexpected, contact a board member.
												</Tooltip.Content>
											</Tooltip.Root>
										{:else if team.members?.find((e) => e.email.toLowerCase() === ($user?.email ?? ''))}
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
															teamButMutable.lastUpdatedBy = $user?.email ?? '';
															teamButMutable.lastUpdatedTime = new Timestamp(
																Date.now() / 1000,
																0,
															);
															await setDoc(
																doc(db, 'events', event.event ?? ''),
																{
																	teams: correctTeamsDataType(
																		data.teams,
																	).filter((t) => t.members.length > 0),
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
																<Button class="bg-green-500 hover:bg-green-400">
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
																				const teamButMutable = team;
																				teamButMutable.members.push({
																					name: person.name,
																					email: person.email,
																				});
																				teamButMutable.lastUpdatedBy =
																					$user?.email ?? '';
																				teamButMutable.lastUpdatedTime =
																					new Timestamp(Date.now() / 1000, 0);
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
																		No one else singed up for this event. Please
																		see a board member for next steps.
																	</li>
																{/each}
															</ul>
														{/if}
													</Dialog.Description>
												</Dialog.Content>
											</Dialog.Root>
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
															teams: data.teams,
														},
														{
															merge: true,
														},
													);
												}}>Become Team Captain</Button
											>
										{:else if !data.locked}
											<p>
												Ask someone in this team to add you if you want to join
												this team!
											</p>
										{/if}
									</Card.Title>
									<Card.Content>
										<ul>
											{#each team.members as teamMember}
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
						{#if !data.locked}
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
						{/if}
					</Card.Root>
				</Doc>
			{/each}
		</div>
	{/if}
</div>
