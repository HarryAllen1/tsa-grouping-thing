<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { removeRef } from '$lib/utils';
	import { Timestamp } from 'firebase/firestore';
	import { getHighlighter, setCDN } from 'shiki';
	import { Collection } from 'sveltefire';

	setCDN('https://esm.sh/shiki@0.14.5/');
	const highlighter = getHighlighter({
		theme: 'one-dark-pro',
		langs: ['json'],
	});
</script>

<div class="container">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Collection</Table.Head>
				<Table.Head>ID</Table.Head>
				<Table.Head>Time</Table.Head>
				<Table.Head>View log</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#await highlighter then hl}
				<Collection
					ref="firestore_logs"
					startWith={[
						{
							collection: '',
							id: '',
							afterData: JSON.parse('{}'),
							beforeData: JSON.parse('{}'),
							timestamp: new Timestamp(0, 0),
							eventType: '',
						},
					]}
					let:data
				>
					{#each data.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds) as log}
						<Table.Row>
							<Table.Cell>
								{log.collection}
							</Table.Cell>
							<Table.Cell>
								{log.id}
							</Table.Cell>
							<Table.Cell>
								{log.timestamp.toDate().toLocaleString()}
							</Table.Cell>
							<Table.Cell>
								<Dialog.Root>
									<Dialog.Trigger>View</Dialog.Trigger>
									<Dialog.Content
										class="max-h-full max-w-fit overflow-y-scroll"
									>
										<Dialog.Title>
											{log.collection}/{log.id}
										</Dialog.Title>
										<!-- eslint-disable-next-line svelte/no-at-html-tags -->
										{@html hl.codeToHtml(
											JSON.stringify(removeRef(log), null, 2),
											{
												lang: 'json',
											},
										)}
									</Dialog.Content>
								</Dialog.Root>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Collection>
			{/await}
		</Table.Body>
	</Table.Root>
</div>
