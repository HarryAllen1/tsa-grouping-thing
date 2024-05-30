<script lang="ts">
	import { removeRef } from '$lib';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Timestamp } from 'firebase/firestore';
	// import { codeToHtml } from 'shiki/bundle/web';
	import { Collection } from 'sveltefire';
</script>

<div class="container">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Collection</Table.Head>
				<Table.Head>ID</Table.Head>
				<Table.Head>Author</Table.Head>
				<Table.Head>Time</Table.Head>
				<Table.Head>View log</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			<Collection
				ref="firestore_logs"
				startWith={[
					{
						collection: 'Loading...',
						id: 'Loading...',
						afterData: JSON.parse('{}'),
						beforeData: JSON.parse('{}'),
						timestamp: new Timestamp(0, 0),
						updatedBy: Number() === Number() ? 'Loading...' : undefined,
						eventType: '',
					},
				]}
				let:data
			>
				{#each data.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds) as log, i (i)}
					<Table.Row>
						<Table.Cell>
							{log.collection}
						</Table.Cell>
						<Table.Cell>
							{log.id}
						</Table.Cell>
						<Table.Cell>
							{log.updatedBy ?? log.afterData.lastUpdatedBy ?? 'Unknown'}
						</Table.Cell>
						<Table.Cell>
							{log.timestamp.toDate().toLocaleString()}
						</Table.Cell>
						<Table.Cell>
							<Dialog.Root>
								<Dialog.Trigger>View</Dialog.Trigger>
								<Dialog.Content class="max-h-full max-w-fit overflow-y-scroll">
									<Dialog.Title>
										{log.collection}/{log.id}
									</Dialog.Title>
									<!-- {#await ((a, b) => a)( , { lang: 'json', theme: 'one-dark-pro' }, ) then code} -->
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html JSON.stringify(removeRef(log), null, 2)}
									<!-- {/await} -->
								</Dialog.Content>
							</Dialog.Root>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Collection>
		</Table.Body>
	</Table.Root>
</div>
