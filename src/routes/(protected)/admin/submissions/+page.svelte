<script lang="ts">
	import { db, downloadURL, eventsCollection, md, StorageMetadata } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { ArrowUpRight, Download } from 'lucide-svelte';
	import { DownloadURL, StorageList } from 'sveltefire';
	import RotatingImage from './RotatingImage.svelte';
	import AddResultDialog from '../results/AddResultDialog.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { doc, setDoc } from 'firebase/firestore';

	let hideEmpty = false;

	let editing = '';
	const descriptions: Record<string, string> = {};

	const nth = (n: number) =>
		n + ['st', 'nd', 'rd'][((((n + 90) % 100) - 10) % 10) - 1] || 'th';
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

					{#if editing === event.event}
						<Textarea
							value={event.submissionDescription}
							placeholder="Submit the following..."
							style="height: {event.submissionDescription.split('\n').length *
								1.5 +
								1}rem;"
							on:input={(e) => {
								if (e.target instanceof HTMLTextAreaElement) {
									e.target.style.height = '';
									e.target.style.height = `${e.target.scrollHeight + 3}px`;
									descriptions[event.event] = e.target.value;
								}
							}}
						/>
						<Button
							class="my-4"
							on:click={async () => {
								await setDoc(
									doc(db, 'events', event.event),
									{
										submissionDescription: descriptions[event.event],
									},
									{ merge: true },
								);
								editing = '';
							}}
						>
							Save
						</Button>
					{:else}
						<div class="prose dark:prose-invert dark:text-white">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html md.render(event.submissionDescription)}
						</div>
						<Button
							class="mb-4"
							on:click={() => {
								editing = event.event;
							}}
						>
							Edit
						</Button>
					{/if}
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
									{@const resultMemberSet = new Set(
										event.results
											?.flatMap((r) => r.members)
											.map((m) => m.email),
									)}
									{@const teamResult = team.members
										.map((m) => m.email)
										.filter((m) => resultMemberSet.has(m))}
									{#if event.results && teamResult.length}
										<Card.Description>
											{nth(
												event.results.findIndex(
													(r) =>
														r.members.map((m) => m.email).join() ===
														teamResult.join(),
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
													<li class="w-full flex flex-row">
														<DownloadURL ref={item.fullPath} let:link>
															<StorageMetadata ref={item.fullPath} let:meta>
																{#if meta.contentType?.startsWith('image/')}
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
																{:else if meta.contentType?.startsWith('video/')}
																	<Dialog.Root>
																		<Dialog.Trigger>
																			{item.name}
																		</Dialog.Trigger>
																		<Dialog.Content
																			class="max-w-full max-h-full p-4 grid place-items-center"
																		>
																			<!-- svelte-ignore a11y-media-has-caption -->
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
																			class="p-4 grid place-items-center"
																		>
																			<audio controls>
																				<source src={link} />
																			</audio>
																		</Dialog.Content>
																	</Dialog.Root>
																{:else if ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf'].includes(meta.contentType ?? '')}
																	<Dialog.Root>
																		<Dialog.Trigger>
																			{item.name}
																		</Dialog.Trigger>
																		<Dialog.Content
																			class="max-w-full max-h-full p-6 grid place-items-center"
																		>
																			<iframe
																				src="https://docs.google.com/viewer?url={encodeURIComponent(
																					link ?? '',
																				)}&embedded=true"
																				class="h-[calc(100vh-2rem)] w-[calc(100vw-6rem)]"
																				frameborder="0"
																				title="A powerpoint presentation"
																			>
																				This document cannot be viewed. Try
																				downloading it using the button in the
																				bottom right.
																			</iframe>
																			<Dialog.Footer>
																				<Button
																					class="fixed bottom-4 right-4 lg:bottom-8 lg:right-8"
																					size="icon"
																					on:click={() => {
																						downloadURL(link ?? '', item.name);
																					}}
																				>
																					<Download />
																				</Button>
																			</Dialog.Footer>
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
													.filter((m) => resultMemberSet.has(m)).length}
												<AddResultDialog {event} editing id={team.id}>
													<Button slot="edit">Edit result</Button>
												</AddResultDialog>
											{:else}
												<AddResultDialog
													members={team.members}
													id={team.id}
													{event}
												>
													<Button slot="add">Add result</Button>
												</AddResultDialog>
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
