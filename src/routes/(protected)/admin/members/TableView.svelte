<script lang="ts">
	import type { UserDoc } from '$lib/types';
	import DataTable from './DataTable.svelte';
	import { columns } from './columns';

	let { results }: { results: UserDoc[] } = $props();
</script>

<DataTable data={results} {columns} />
