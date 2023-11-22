<script lang="ts">
	import { eventsCollection, user } from '$lib';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { DownloadURL } from 'sveltefire';
</script>

<div class="container my-4">
	<h2
		class="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		Elimination Results
	</h2>
	<p class="pb-2">
		Eliminations completed individually might be colored incorrectly.
	</p>

	<div
		class="grid items-center w-full gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 lg:items-start"
	>
		{#each $eventsCollection
			.filter((e) => e.results?.length)
			.sort((a, b) => a.event.localeCompare(b.event)) as event}
			<Card.Root>
				<Card.Header>
					<Card.Title>
						{event.event}
					</Card.Title>
					<Card.Description>
						Top {event.perChapter} teams go to state
					</Card.Description>
				</Card.Header>
				<Card.Content>
					{#if event.results}
						<ol class="mb-2 ml-6 [&>li]:mt-2 list-decimal">
							{#each event.results as result, i}
								<li
									class={i < event.perChapter ? 'text-green-500 font-bold' : ''}
								>
									{#each result.members as member, i}
										<!-- DO NOT FORMAT -->
										{member.name}{#if member.email === $user.email}
											{' '}(you){/if}{#if i < result.members.length - 1}, {' '}
										{/if}
									{/each}
									{#if result.members
										.map((u) => u.email.toLowerCase())
										.includes($user.email?.toLowerCase() ?? '') && (result.rubricPaths?.length || result.note)}
										<Dialog.Root>
											<Dialog.Trigger class="underline">
												View Rubric
											</Dialog.Trigger>
											<Dialog.Content>
												<Dialog.Title>Rubric</Dialog.Title>
												{#if result.note}
													{result.note}
												{/if}
												{#each result.rubricPaths ?? [] as rubric}
													<DownloadURL ref={rubric} let:link>
														{#if link}
															{@const url = new URL(link)}
															{#if ['.jpg', '.jpeg', '.webp', '.png', '.avif'].includes(url.pathname
																	.slice(-4)
																	.toLowerCase())}
																<img src={link} alt="Rubric" />
															{:else if url.pathname
																.slice(-4)
																.toLowerCase() === '.pdf'}
																<iframe
																	src={link}
																	title="Rubric"
																	class="w-full h-96"
																/>
															{:else}
																<a
																	href={link}
																	target="_blank"
																	rel="noopener noreferrer"
																>
																	{url.pathname.slice(1)}
																</a>
															{/if}
														{/if}
													</DownloadURL>
												{/each}
											</Dialog.Content>
										</Dialog.Root>
									{/if}
								</li>
							{/each}
						</ol>
					{/if}
				</Card.Content>
			</Card.Root>
		{:else}
			<p class="text-gray-500">No results posted yet</p>
		{/each}
	</div>
</div>
