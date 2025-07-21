<script lang="ts">
	import { allUsersCollection } from '$lib/stores';
	import { openUserDialog } from '../user-dialog';

	interface Props {
		user: string;
	}

	let { user }: Props = $props();
</script>

<button
	class="cursor-pointer font-medium underline underline-offset-4"
	onclick={() => {
		openUserDialog(user);
	}}
>
	{$allUsersCollection.find((u) => u.email === user)?.name}
</button>
