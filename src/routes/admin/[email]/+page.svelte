<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth, db, events, memberData } from '$lib';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/alert';
	import { Button } from '$lib/components/button';
	import * as Card from '$lib/components/card';
	import * as Dialog from '$lib/components/dialog';
	import * as Tooltip from '$lib/components/tooltip';
	import { correctTeamsDataType } from '$lib/types';
	import * as Select from '$lib/components/select';
	import { signOut } from 'firebase/auth';
	import { doc, setDoc, type DocumentData } from 'firebase/firestore';
	import { Plus } from 'lucide-svelte';
	import { writable } from 'svelte/store';
	import { Doc, userStore } from 'sveltefire';
	import { admins } from '../../admins';

	const aaaaaaaaa = userStore(auth);

	if (!$aaaaaaaaa) goto('/login');
	if (!$aaaaaaaaa || !admins.includes($aaaaaaaaa.email?.toLowerCase() ?? '')) {
		goto('/');
	}

	const user = writable({
		...$aaaaaaaaa,
		email: decodeURIComponent($page.params.email),
		displayName: memberData.find(
			(m) =>
				m.email.toLowerCase() ===
				decodeURIComponent($page.params.email).toLowerCase(),
		)?.name,
	});

	const selectOptions = memberData
		.map((m) => ({
			value: m.email,
			label: m.name,
		}))
		.sort((a, b) => a.label.localeCompare(b.label));

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
	<Button on:click={() => signOut(auth)} class="mb-4">Sign out</Button>
	<Select.Root
		onSelectedChange={async (option) =>
			await goto(`/admin/${encodeURIComponent(String(option?.value))}`)}
	>
		<Select.Trigger class="w-56 mb-4">
			<Select.Value placeholder={$user.displayName} />
		</Select.Trigger>
		<Select.Content class="max-h-full overflow-y-scroll">
			{#each selectOptions as option}
				<Select.Item value={option.value} label={option.label}>
					<a href="/admin/{encodeURIComponent(option.value)}">{option.label}</a>
				</Select.Item>
			{/each}
		</Select.Content>
		<Select.Input name="favoriteFruit" />
	</Select.Root>
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
		{#if admins.includes($aaaaaaaaa?.email ?? '')}
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
									The team for this event will be based off of a test which you
									will take at a later date.
								</p>
							{:else}
								{#each data.teams as te}
									{@const team = correctType(te)}
									<Card.Root class="bg-blue-500 bg-opacity-20">
										<Card.Title class="m-2 ml-4">
											<Button
												variant="destructive"
												on:click={async () => {
													const members = team.members;
													members.splice(
														members.findIndex(
															(e) =>
																e.email.toLowerCase() === ($user?.email ?? ''),
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
												}}>Leave</Button
											>
											<Dialog.Root>
												<Dialog.Trigger>
													<Button class="bg-green-500 hover:bg-green-400"
														>Add people</Button
													>
												</Dialog.Trigger>

												<Dialog.Content class="max-h-full overflow-y-scroll">
													<Dialog.Title>Add People</Dialog.Title>
													<Dialog.Description>
														<p>All people not already in team:</p>
														<ul>
															{#each memberData
																.filter((p) => !team.members.filter((t) => t.email === p.email).length)
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
																			const members = team.members;
																			members.push({
																				name: person.name,
																				email: person.email,
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
															const members = team.members;
															members.splice(
																members.findIndex(
																	(e) =>
																		e.email === (teamMember?.email ?? '') &&
																		e.name === (teamMember?.name ?? ''),
																),
																1,
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
