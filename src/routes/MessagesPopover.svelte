<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import MessagesOverview from './MessagesOverview.svelte';
	import TeamMessages from './TeamMessages.svelte';
	import { selected } from './messages';
	import { notificationPermission } from './notifications';

	onMount(async () => {
		const permission = await Notification.requestPermission();

		$notificationPermission = permission;
	});
</script>

{#if !$selected}
	<MessagesOverview />
{:else}
	<TeamMessages teamId={$selected} />
{/if}
