<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { db } from '$lib/firebase';
	import { noHtmlMd } from '$lib/md';
	import { eventsCollection } from '$lib/stores';
	import type { SimpleMessage } from '$lib/types';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import { setContext } from 'svelte';
	import { collectionStore } from 'sveltefire';
	import TeamMessages from '../../../TeamMessages.svelte';

	const blockedMessages = collectionStore<
		SimpleMessage & {
			teamId: string;
			teamNumber: number;
			event: string;
		}
	>(db, 'blockedMessages');

	setContext('isAdminMessages', true);
</script>

<svelte:head>
	<title>Admin Message Moderation — JHS TSA Teaming</title>
</svelte:head>

<div class="container pt-8">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
		Message Moderation
	</h1>

	{#each $eventsCollection.filter((e) => e.maxTeamSize > 1) as event}
		<div class="my-4">
			<h2
				class="mb-4 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
			>
				{event.event}
			</h2>

			<div
				class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:items-start xl:grid-cols-3"
			>
				{#each event.teams as team}
					<Card.Root class="pt-4">
						<Card.Content>
							<TeamMessages hideBack teamId={team.id} />
							{#if $blockedMessages.find((message) => message.teamId === team.id)}
								<Collapsible.Root class="mt-4">
									<Collapsible.Trigger>
										{#snippet child({ props })}
											<Button
												variant="ghost"
												size="sm"
												class="flex w-full items-center p-2"
												{...props}
											>
												Blocked Messages
												<div class="flex-1"></div>
												<ChevronsUpDown />
											</Button>
										{/snippet}
									</Collapsible.Trigger>
									<Collapsible.Content>
										{#each $blockedMessages.filter((message) => message.teamId === team.id) as message}
											<div class="mt-4 flex space-x-2">
												<div class="flex flex-col">
													<p>
														<strong>{message.sender.name}</strong>
														<span class="opacity-80">
															{new Date(
																message.time.seconds * 1000 +
																	message.time.nanoseconds / 1_000_000,
															).toLocaleString()}
														</span>
													</p>
													<p class="prose dark:prose-invert">
														<!-- eslint-disable-next-line svelte/no-at-html-tags -->
														{@html noHtmlMd.render(message.content)}
													</p>
												</div>
											</div>
										{/each}
									</Collapsible.Content>
								</Collapsible.Root>
							{/if}
						</Card.Content>
					</Card.Root>
				{:else}
					<p>No teams</p>
				{/each}
			</div>
		</div>
	{:else}
		<p>harry is an idiot</p>
	{/each}
</div>
