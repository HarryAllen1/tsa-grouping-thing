<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let lastToastId: string | number | undefined;

	const onlineListener = () => {
		toast.dismiss(lastToastId);
	};
	const offlineListener = () => {
		lastToastId = toast.error('You are offline. Functionality is limited.', {
			duration: Number.POSITIVE_INFINITY,
		});
	};

	onMount(() => {
		if (!navigator.onLine) {
			offlineListener();
		}
	});
</script>

<svelte:window ononline={onlineListener} onoffline={offlineListener} />
