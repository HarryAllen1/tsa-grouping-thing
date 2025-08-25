<script lang="ts">
	import { resolveName } from '$lib/better-utils';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import { storage } from '$lib/firebase';
	import { md } from '$lib/md';
	import { allUsersCollection, user } from '$lib/stores';
	import type { EventDoc, Result } from '$lib/types';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import { listAll, ref } from 'firebase/storage';
	import { DownloadURL } from 'sveltefire';

	let {
		event,
	}: {
		event: EventDoc;
	} = $props();

	let open = $state(false);
</script>

{#snippet resultItem(result: Result, i: number)}
	{@const rubrics = listAll(
		ref(storage, `results/${event.event}/${result.id}`),
	)}
	<li class={i < event.perChapter ? 'font-bold text-green-500' : ''}>
		{#each result.members as member, i}
			<!-- DO NOT FORMAT -->
			{resolveName(
				member,
				$allUsersCollection,
			)}{#if member.email === $user.email}
				<!-- eslint-disable-next-line svelte/no-useless-mustaches -->
				{' '}(you){/if}{#if i < result.members.length - 1}, {' '}
			{/if}
		{/each}
		{#await rubrics then rubs}
			{#if result.members
				.map((u) => u.email.toLowerCase())
				.includes($user.email?.toLowerCase() ?? '') && (rubs.items.length > 0 || result.note)}
				<Dialog.Root>
					<Dialog.Trigger class="underline">View rubric</Dialog.Trigger>
					<Dialog.Content class="max-h-screen overflow-y-auto">
						<Dialog.Title>Rubric</Dialog.Title>
						{#if result.note}
							<div class="prose dark:prose-invert">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html md.render(result.note)}
							</div>
						{/if}
						{#each rubs.items ?? [] as rubric}
							<DownloadURL ref={rubric} let:link>
								{#if link}
									{@const url = new URL(link)}
									{#if ['.jpg', '.jpeg', '.webp', '.png', '.avif'].includes(url.pathname
											.slice(-4)
											.toLowerCase())}
										<a href={link} target="_blank">
											<img src={link} alt="Rubric" />
										</a>
									{:else}
										<a href={link} target="_blank" rel="noopener noreferrer">
											{url.pathname.slice(1)}
										</a>
									{/if}
								{/if}
							</DownloadURL>
						{/each}
					</Dialog.Content>
				</Dialog.Root>
			{/if}
		{/await}
	</li>
{/snippet}

<Card.Root>
	<Card.Header>
		<Card.Title>
			{event.event}
		</Card.Title>
		<Card.Description>
			Top {event.perChapter > 1 ? event.perChapter : ''}
			{event.maxTeamSize === 1 ? 'individual' : 'team'}{event.perChapter > 1
				? 's'
				: ''} advance{event.perChapter > 1 ? '' : 's'} to the January Qualifier
		</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if event.results!.length <= 10}
			<ol class="mb-2 ml-6 list-decimal [&>li]:mt-2">
				{#each event.results ?? [] as result, i}
					{@render resultItem(result, i)}
				{/each}
			</ol>
		{:else}
			<Collapsible.Root bind:open>
				<ol class="mb-2 ml-6 list-decimal [&_li]:mt-2">
					{#each (event.results ?? []).slice(0, 10) as result, i}
						{@render resultItem(result, i)}
					{/each}
					<Collapsible.Content>
						{#each (event.results ?? []).slice(10) as result, i}
							{@render resultItem(result, i + 10)}
						{/each}
					</Collapsible.Content>
				</ol>
				<Collapsible.Trigger class="w-full">
					<Button variant="ghost" size="sm" class="mt-4 w-full">
						<ChevronUp
							class="transition-transform {open ? '' : 'rotate-180'}"
						/>
					</Button>
				</Collapsible.Trigger>
			</Collapsible.Root>
		{/if}
	</Card.Content>
</Card.Root>
