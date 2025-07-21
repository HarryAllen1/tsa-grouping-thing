<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import { CHAPTER_ID } from '$lib/constants';
	import { db, storage } from '$lib/firebase';
	import { md } from '$lib/md';
	import { user } from '$lib/stores';
	import type { EventDoc } from '$lib/types';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { doc, updateDoc } from 'firebase/firestore';
	import { getBlob, listAll, ref } from 'firebase/storage';
	import JSZip from 'jszip';
	import SubmissionTeam from './SubmissionTeam.svelte';

	let {
		event,
	}: {
		event: EventDoc;
	} = $props();

	let count = $state(0);
</script>

<div class="my-4">
	<h2
		class="mb-4 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		{event.event}
	</h2>
	{#if event.submissionDescription}
		<div>
			<h3
				class="scroll-m-20 text-2xl font-semibold tracking-tight"
				id={event.event
					.toLowerCase()
					.replace(' (washington only)', '')
					.replaceAll(' ', '-')}
			>
				Submission Requirements
			</h3>

			<div class="prose dark:prose-invert dark:text-white">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html md.render(event.submissionDescription)}
			</div>
			<Dialog.Root>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button variant="default" {...props}>Edit</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Title>Edit submission description</Dialog.Title>
					<p>Markdown is allowed</p>
					<Textarea
						autosize
						placeholder="Submission description"
						class="w-full"
						bind:value={event.submissionDescription}
					/>
					<Dialog.Footer>
						<Dialog.Close>
							{#snippet child({ props })}
								<Button
									variant="default"
									onclick={async () => {
										await updateDoc(doc(db, 'events', event.event), {
											submissionDescription: event.submissionDescription ?? '',
											lastUpdatedBy: $user?.email ?? '',
										});
									}}
									{...props}
								>
									Save
								</Button>
							{/snippet}
						</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
			<Button
				variant="ghost"
				class="mx-2"
				onclick={() => {
					count++;
				}}
			>
				<RefreshCw /> Refresh
			</Button>
			<Button
				variant="ghost"
				class="mx-2"
				onclick={async () => {
					const zip = new JSZip();
					for (const team of event.teams) {
						const teamFolder = zip.folder(`${CHAPTER_ID}-${team.teamNumber}`);
						const submissions = await listAll(
							ref(storage, `submissions/${event.event}/${team.id}`),
						);

						for (const item of submissions.items) {
							teamFolder!.file(item.name, await getBlob(item));
						}
					}

					const blob = await zip.generateAsync({ type: 'blob' });
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');

					a.href = url;
					a.download = `${event.event}.zip`;
					a.click();

					URL.revokeObjectURL(url);
				}}>Download all</Button
			>
		</div>
	{/if}
	<div
		class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:items-start xl:grid-cols-3"
	>
		{#key count}
			{#each event.teams as team (team.id)}
				<SubmissionTeam {team} {event} />
			{:else}
				<p>No teams</p>
			{/each}
		{/key}
	</div>
</div>
