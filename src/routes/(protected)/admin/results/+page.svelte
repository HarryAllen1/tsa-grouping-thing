<script lang="ts">
	import { db, eventsCollection, user } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { X } from 'lucide-svelte';
	import AddResultDialog from './AddResultDialog.svelte';
	import { doc, setDoc } from 'firebase/firestore';

	const rerenderMap: Record<string, number> = {};
	const rerender = (event: string) => {
		rerenderMap[event] = (rerenderMap[event] ?? 0) + 1;
	};
</script>

<div class="container my-4">
	<h2
		class="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		Elimination Results
	</h2>

	<div
		class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:items-start xl:grid-cols-3"
	>
		{#each $eventsCollection as event}
			{#key rerenderMap[event.event]}
				<Card.Root>
					<Card.Header>
						<Card.Title>
							{event.event}
						</Card.Title>
						<Card.Description>
							Top {event.perChapter} go to state
						</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if event.results && event.results.length > 0}
							<ol class="my-6 ml-6 list-decimal [&>li]:mt-2">
								{#each event.results as result, i}
									<li
										class={i < event.perChapter
											? 'font-bold text-green-500'
											: ''}
									>
										<div>
											{#each result.members as member, i}
												<a href="/events/{member.email}">
													<!-- DO NOT FORMAT -->
													{member.name}{#if member.email === $user.email}
														{' '}(you){/if}{#if i < result.members.length - 1}, {' '}
													{/if}
												</a>
											{/each}
										</div>
										<AddResultDialog
											onOpenChange={(open) => {
												if (!open) rerender(event.event);
											}}
											{event}
											id={result.id}
											editing
										/>
										<Button
											on:click={async () => {
												await setDoc(
													doc(db, 'events', event.event),
													{
														results: event.results?.filter(
															(r) => r.id !== result.id,
														),
														lastUpdatedBy: $user?.email ?? '',
													},
													{
														merge: true,
													},
												);
											}}
											size="icon"
											variant="ghost"
											class="h-6"
										>
											<X />
										</Button>
									</li>
								{/each}
							</ol>
						{:else}
							<p class="text-gray-500">No results posted yet</p>
						{/if}
					</Card.Content>
					<Card.Footer>
						<AddResultDialog
							onOpenChange={(open) => {
								if (!open) rerender(event.event);
							}}
							{event}
						/>
					</Card.Footer>
				</Card.Root>
			{/key}
		{/each}
	</div>
</div>
