<script lang="ts">
	import { eventsCollection, md, StorageMetadata } from '$lib';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { ArrowUpRight } from 'lucide-svelte';
	import { DownloadURL, StorageList } from 'sveltefire';
	import RotatingImage from './RotatingImage.svelte';

	const viewableImageTypes = [
		'image/png',
		'image/jpeg',
		'image/gif',
		'image/svg+xml',
		'image/webp',
		'image/bmp',
		'image/avif',
	];
	let hideEmpty = false;
</script>

<div class="container pt-8">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
		Submissions!!!!!!!!!
	</h1>

	<Label class="flex items-center space-x-2 my-2">
		<Switch bind:checked={hideEmpty} />
		<span>Hide teams without submissions</span>
	</Label>

	{#each $eventsCollection as event}
		<div class="my-4">
			<h2
				class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 mb-4"
			>
				{event.event}
			</h2>
			{#if event.submissionDescription}
				<div>
					<h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">
						Submission Requirements
					</h3>

					<div class="prose dark:prose-invert dark:text-white">
						{@html md.render(event.submissionDescription)}
					</div>
				</div>
			{/if}
			<div
				class="grid items-center w-full gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 lg:items-start"
			>
				{#each event.teams as team}
					<StorageList
						ref="submissions/{event.event}/{team.id}"
						let:list
						let:ref
					>
						{#if !hideEmpty || list?.items.length}
							<Card.Root>
								<Card.Header>
									<Card.Title>
										{team.members
											.map((m) =>
												m.email === team.teamCaptain ? `👑${m.name}👑` : m.name,
											)
											.join(', ')}
									</Card.Title>
								</Card.Header>
								<Card.Content>
									{#if ref}
										{#if list?.items.length}
											<ul>
												{#each list.items as item}
													<li class="w-full flex flex-row">
														<DownloadURL ref={item.fullPath} let:link>
															<StorageMetadata ref={item.fullPath} let:meta>
																{#if viewableImageTypes.includes(meta.contentType ?? '')}
																	<Dialog.Root>
																		<Dialog.Trigger>
																			{item.name}
																		</Dialog.Trigger>
																		<Dialog.Content>
																			<RotatingImage
																				clickableImage
																				src={link}
																				alt={item.name}
																				class="max-w-full max-h-full"
																			/>
																		</Dialog.Content>
																	</Dialog.Root>
																{:else}
																	<a
																		href={link}
																		target="_blank"
																		rel="noreferrer"
																		class="flex flex-row items-center"
																	>
																		{item.name}
																		<ArrowUpRight class="h-4 opacity-50" />
																	</a>
																{/if}
																<div class="flex-grow" />
																<span>
																	{new Date(meta.timeCreated).toLocaleString()}
																</span>
															</StorageMetadata>
														</DownloadURL>
													</li>
												{/each}
											</ul>
										{:else}
											<p>No submissions</p>
										{/if}
									{:else}
										<p>uh oh an oopsey occurred</p>
									{/if}
								</Card.Content>
							</Card.Root>
						{/if}
					</StorageList>
				{:else}
					<p>No teams</p>
				{/each}
			</div>
		</div>
	{:else}
		<p>harry is an idiot</p>
	{/each}
</div>
