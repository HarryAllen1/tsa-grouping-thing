<script lang="ts">
	import { db, eventsCollection, md, StorageMetadata, user } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { doc, setDoc } from 'firebase/firestore';
	import type { FullMetadata } from 'firebase/storage';
	import { ArrowUpRight } from 'lucide-svelte';
	import { DownloadURL, StorageList } from 'sveltefire';
	import AddResultDialog from '../results/AddResultDialog.svelte';

	let hideEmpty = $state(false);

	const nth = (n: number) =>
		n + ['st', 'nd', 'rd'][((((n + 90) % 100) - 10) % 10) - 1] || 'th';
</script>

<svelte:head>
	<title>Admin Result Management — JHS TSA Teaming</title>
</svelte:head>

<div class="container pt-8">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
		Submissions
	</h1>

	<Label class="my-2 flex items-center space-x-2">
		<Switch bind:checked={hideEmpty} />
		<span>Hide teams without submissions</span>
	</Label>

	{#each $eventsCollection.filter((e) => !['*Rooming', '*Cardboard Boat'].includes(e.event)) as event (event.event)}
		<div class="my-4">
			<h2
				class="mb-4 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
			>
				{event.event}
			</h2>
			{#if event.submissionDescription}
				<div>
					<h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">
						Submission Requirements
					</h3>

					<div class="prose dark:prose-invert dark:text-white">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html md.render(event.submissionDescription)}
					</div>
					<Dialog.Root>
						<Dialog.Trigger asChild let:builder>
							<Button variant="default" builders={[builder]}>Edit</Button>
						</Dialog.Trigger>
						<Dialog.Content>
							<Dialog.Title>Edit submission description</Dialog.Title>
							<p>Markdown is allowed</p>
							<Textarea
								placeholder="Submission description"
								class="w-full"
								bind:value={event.submissionDescription}
							/>
							<Dialog.Footer>
								<Dialog.Close asChild let:builder>
									<Button
										builders={[builder]}
										variant="default"
										on:click={() => {
											setDoc(
												doc(db, 'events', event.event),
												{
													submissionDescription:
														event.submissionDescription ?? '',
													lastUpdatedBy: $user?.email ?? '',
												},
												{
													merge: true,
												},
											);
										}}
									>
										Save
									</Button>
								</Dialog.Close>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Root>
				</div>
			{/if}
			<div
				class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:items-start xl:grid-cols-3"
			>
				{#each event.teams as team (team.id)}
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
											.join(', ')} ({team.teamNumber})
									</Card.Title>
									{@const resultMemberSet = new Set(
										event.results
											?.flatMap((r) => r.members)
											.map((m) => m.email),
									)}
									{@const teamResult = team.members
										.map((m) => m.email)
										.filter((m) => resultMemberSet.has(m))}
									{#if event.results && teamResult.length > 0}
										<Card.Description>
											{nth(
												event.results.findIndex(
													(r) =>
														r.members
															.map((m) => m.email)
															.sort((a, b) => a.localeCompare(b))
															.join(',') ===
														teamResult
															.sort((a, b) => a.localeCompare(b))
															.join(','),
												) + 1,
											)}
											place
										</Card.Description>
									{/if}
								</Card.Header>
								<Card.Content>
									{#if ref}
										{#if list?.items.length}
											<ul>
												{#each list.items as item}
													<li class="flex w-full flex-row">
														{#snippet submissionInfo(
															link: string,
															meta: FullMetadata,
														)}
															<!-- {#if meta.contentType?.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif'].some( (ext) => item.name.endsWith(ext), )}
																<Dialog.Root>
																	<Dialog.Trigger>
																		{item.name}
																	</Dialog.Trigger>
																	<Dialog.Content>
																		<RotatingImage
																			clickableImage
																			src={link}
																			alt={item.name}
																			class="max-h-full max-w-full"
																		/>
																	</Dialog.Content>
																</Dialog.Root>
															{:else if meta.contentType?.startsWith('video/')}
																<Dialog.Root>
																	<Dialog.Trigger>
																		{item.name}
																	</Dialog.Trigger>
																	<Dialog.Content
																		class="grid max-h-full max-w-full place-items-center p-4"
																	>
																		<video
																			controls
																			class="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]"
																		>
																			<source src={link} />
																		</video>
																	</Dialog.Content>
																</Dialog.Root>
															{:else if meta.contentType?.startsWith('audio/')}
																<Dialog.Root>
																	<Dialog.Trigger>
																		{item.name}
																	</Dialog.Trigger>
																	<Dialog.Content
																		class="grid place-items-center p-4"
																	>
																		<audio controls>
																			<source src={link} />
																		</audio>
																	</Dialog.Content>
																</Dialog.Root> -->
															{#if ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(meta.contentType ?? '')}
																<a
																	href="https://docs.google.com/viewer?url={encodeURIComponent(
																		link ?? '',
																	)}"
																	target="_blank"
																	rel="noreferrer"
																	class="w-full text-start">{item.name}</a
																>
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
															<div class="flex-grow"></div>
															<span>
																<HoverCard.Root>
																	<HoverCard.Trigger>
																		{new Date(
																			meta.timeCreated,
																		).toLocaleString()}
																	</HoverCard.Trigger>
																	<HoverCard.Content>
																		<p>
																			{meta.customMetadata?.userName}
																		</p>
																		<p>
																			{meta.customMetadata?.userEmail}
																		</p>
																	</HoverCard.Content>
																</HoverCard.Root>
															</span>
														{/snippet}
														<DownloadURL ref={item.fullPath} let:link>
															<StorageMetadata
																ref={item.fullPath}
																link={link ?? ''}
																withMetadata={submissionInfo}
															></StorageMetadata>
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
								<Card.Footer>
									{#key [event.results, team.members]}
										{#if true}
											{@const resultMemberSet = new Set(
												event.results
													?.flatMap((r) => r.members)
													.map((m) => m.email),
											)}
											{#if event.results && team.members
													.map((m) => m.email)
													.some((m) => resultMemberSet.has(m))}
												{#snippet edit()}
													<Button>Edit result</Button>
												{/snippet}
												<AddResultDialog {edit} {event} editing id={team.id}
												></AddResultDialog>
											{:else}
												{#snippet add()}
													<Button>Add result</Button>
												{/snippet}
												<AddResultDialog
													{add}
													members={team.members}
													id={team.id}
													{event}
												></AddResultDialog>
											{/if}
										{/if}
									{/key}
								</Card.Footer>
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
