<script lang="ts">
	import { getMetadata, ref, type StorageReference } from 'firebase/storage';
	import { getFirebaseContext } from 'sveltefire';

	let reference: string | StorageReference;
	export { reference as ref };

	const { storage } = getFirebaseContext();
	if (!storage) {
		throw new Error('Firebase storage is not initialized');
	}
	const storageRef =
		typeof reference === 'string' ? ref(storage, reference) : reference;

	const metadata = getMetadata(storageRef);
</script>

{#await metadata}
	<slot name="loading" />
{:then meta}
	<slot {meta} />
{:catch error}
	<slot name="error" {error} />
{/await}
