<script lang="ts">
	import MessagesOverview from './MessagesOverview.svelte';
	import TeamMessages from './TeamMessages.svelte';
	import { selected } from './messages';
</script>

{#if !$selected}
	<MessagesOverview />
{:else}
	<TeamMessages teamId={$selected} />
{/if}
