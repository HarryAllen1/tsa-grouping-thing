<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { currentUserDialogUser, userDialogOpen } from './user-dialog';
	import UserCard from './UserCard.svelte';
</script>

<Dialog.Root bind:open={$userDialogOpen}>
	<Dialog.Content>
		{#if $currentUserDialogUser}
			<UserCard user={$currentUserDialogUser} />
		{/if}
	</Dialog.Content>
</Dialog.Root>
