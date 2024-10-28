<script lang="ts">
	import {
		getMetadata,
		ref,
		type FullMetadata,
		type StorageReference,
	} from 'firebase/storage';
	import type { Snippet } from 'svelte';
	import { getFirebaseContext } from 'sveltefire';

	let {
		ref: reference,
		loading,
		link,
		withMetadata,
		error,
	}: {
		ref: string | StorageReference;
		link: string;
		loading?: Snippet;
		withMetadata: Snippet<[string, FullMetadata]>;
		error?: Snippet<[unknown]>;
	} = $props();

	const { storage } = getFirebaseContext();
	if (!storage) {
		throw new Error('Firebase storage is not initialized');
	}
	const storageRef =
		typeof reference === 'string' ? ref(storage, reference) : reference;

	const metadata = getMetadata(storageRef);
</script>

{#await metadata}
	{#if loading}
		{@render loading()}
	{/if}
{:then meta}
	{@render withMetadata(link, meta)}
{:catch e}
	{#if error}
		{@render error(e)}
	{/if}
{/await}
