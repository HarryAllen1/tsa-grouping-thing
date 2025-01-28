<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Popover from '$lib/components/ui/popover';
	import StorageMetadata from '$lib/StorageMetadata.svelte';
	import type { EventDoc, Team } from '$lib/types';
	import { getBlob, type FullMetadata } from 'firebase/storage';
	import JSZip from 'jszip';
	import ArrowUpRight from 'lucide-svelte/icons/arrow-up-right';
	import { DownloadURL, StorageList } from 'sveltefire';
	import AddResultDialog from '../results/AddResultDialog.svelte';
	import { hideEmpty } from './state';

	let {
		event,
		team,
	}: {
		event: EventDoc;
		team: Team;
	} = $props();

	const nth = (n: number) =>
		n + (['st', 'nd', 'rd'][((((n + 90) % 100) - 10) % 10) - 1] || 'th');
</script>

<StorageList ref="submissions/{event.event}/{team.id}" let:list let:ref>
	{#if !$hideEmpty || list?.items.length}
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
					event.results?.flatMap((r) => r.members).map((m) => m.email),
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
									teamResult.sort((a, b) => a.localeCompare(b)).join(','),
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
									<DownloadURL ref={item.fullPath} let:link>
										<StorageMetadata ref={item.fullPath} link={link ?? ''}>
											{#snippet withMetadata(link: string, meta: FullMetadata)}
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
														class="w-full text-start break-words">{item.name}</a
													>
												{:else}
													<a
														href={link}
														target="_blank"
														rel="noreferrer"
														class="flex flex-row items-center break-words"
													>
														{item.name}
														<ArrowUpRight class="h-4 opacity-50" />
													</a>
												{/if}
												<div class="grow"></div>
												<span>
													<Popover.Root>
														<Popover.Trigger>
															{new Date(meta.timeCreated).toLocaleString()}
														</Popover.Trigger>
														<Popover.Content>
															<p>
																{meta.customMetadata?.userName}
															</p>
															<p>
																{meta.customMetadata?.userEmail}
															</p>
														</Popover.Content>
													</Popover.Root>
												</span>
											{/snippet}
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
							event.results?.flatMap((r) => r.members).map((m) => m.email),
						)}
						{#if event.results && team.members
								.map((m) => m.email)
								.some((m) => resultMemberSet.has(m))}
							<AddResultDialog {event} editing id={team.id}>
								{#snippet edit({ props })}
									<Button {...props}>Edit result</Button>
								{/snippet}
							</AddResultDialog>
						{:else}
							<AddResultDialog members={team.members} id={team.id} {event}>
								{#snippet add({ props })}
									<Button {...props}>Add result</Button>
								{/snippet}
							</AddResultDialog>
						{/if}
					{/if}
				{/key}
				<Button
					class="ml-2"
					variant="ghost"
					onclick={async () => {
						const zip = new JSZip();
						for (const item of list?.items ?? []) {
							const blob = await getBlob(item);
							zip.file(item.name, blob);
						}

						const blob = await zip.generateAsync({ type: 'blob' });
						const url = URL.createObjectURL(blob);
						const a = document.createElement('a');

						a.href = url;
						a.download = `2082-${team.teamNumber} ${event.event}.zip`;
						a.click();
						URL.revokeObjectURL(url);
					}}
				>
					Download files
				</Button>
			</Card.Footer>
		</Card.Root>
	{/if}
</StorageList>
