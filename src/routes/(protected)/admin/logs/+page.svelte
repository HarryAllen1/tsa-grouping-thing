<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { db } from '$lib/firebase';
	import {
		collection,
		endBefore,
		getDocs,
		limit,
		orderBy,
		query,
		QueryDocumentSnapshot,
		startAfter,
		where,
		type DocumentData,
	} from 'firebase/firestore';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ChevronsLeft from 'lucide-svelte/icons/chevrons-left';
	import { onMount } from 'svelte';
	import { columns, type FirestoreLog } from './columns';
	import DataTable from './DataTable.svelte';

	let docs: QueryDocumentSnapshot<DocumentData, DocumentData>[] = $state([]);
	let data: FirestoreLog[] = $derived(
		docs.map((doc) => doc.data() as FirestoreLog),
	);
	let cursorIndex = $state(0);
	let firstDocTime = 0;

	const PAGE_SIZE = 25;

	onMount(async () => {
		const eventLogQuery = query(
			collection(db, 'event_logs'),
			orderBy('updatedAt', 'desc'),
			limit(PAGE_SIZE),
		);

		docs = (await getDocs(eventLogQuery)).docs;
		firstDocTime = docs[0].data().updatedAt;
	});
</script>

<svelte:head>
	<title>Admin Event Logs — JHS TSA Teaming</title>
</svelte:head>

<div class="container py-8">
	<h1
		class="mb-4 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
	>
		Event Logs
	</h1>

	<DataTable {data} {columns} />

	<div class="flex items-center space-x-6 lg:space-x-8">
		<div class="flex items-center space-x-2">
			<Button
				variant="outline"
				class="hidden size-8 p-0 lg:flex"
				disabled={cursorIndex === 0}
				onclick={async () => {
					cursorIndex = 0;

					const eventLogQuery = query(
						collection(db, 'event_logs'),
						orderBy('updatedAt', 'desc'),
						where('updatedAt', '<', firstDocTime),
						limit(PAGE_SIZE),
					);

					docs = (await getDocs(eventLogQuery)).docs;
				}}
			>
				<span class="sr-only">Go to first page</span>
				<ChevronsLeft />
			</Button>
			<Button
				variant="outline"
				class="size-8 p-0"
				disabled={cursorIndex === 0}
				onclick={async () => {
					cursorIndex -= 1;

					const eventLogQuery = query(
						collection(db, 'event_logs'),
						orderBy('updatedAt', 'desc'),
						where('updatedAt', '<', firstDocTime),
						limit(PAGE_SIZE),
						endBefore(docs[0]),
					);

					docs = (await getDocs(eventLogQuery)).docs;
				}}
			>
				<span class="sr-only">Go to previous page</span>
				<ChevronLeft />
			</Button>
			<Button
				variant="outline"
				class="size-8 p-0"
				onclick={async () => {
					cursorIndex += 1;

					const eventLogQuery = query(
						collection(db, 'event_logs'),
						orderBy('updatedAt', 'desc'),
						where('updatedAt', '<', firstDocTime),
						limit(PAGE_SIZE),
						startAfter(docs.at(-1)),
					);

					docs = (await getDocs(eventLogQuery)).docs;
				}}
				disabled={docs.length < PAGE_SIZE}
			>
				<span class="sr-only">Go to next page</span>
				<ChevronRight />
			</Button>
		</div>
	</div>
</div>
