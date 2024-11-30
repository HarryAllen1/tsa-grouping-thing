<script lang="ts">
	import { type UserDoc } from '$lib';
	import DataTable from './DataTable.svelte';
	import { columns } from './columns';

	let { results }: { results: UserDoc[] } = $props();
</script>

<DataTable data={results} {columns} />
