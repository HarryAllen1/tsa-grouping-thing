<script lang="ts">
	import { allUsersCollection } from '$lib/stores';

	interface Props {
		user: string;
	}

	let { user }: Props = $props();
</script>

<div>
	{$allUsersCollection.find((u) => u.email === user)?.name}
</div>
