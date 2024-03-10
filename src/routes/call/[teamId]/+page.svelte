<script lang="ts">
	import { servers } from '$lib/calling';
	import { onDestroy, onMount } from 'svelte';

	const pc = new RTCPeerConnection(servers);
	let remoteVideoEl: HTMLVideoElement;
	let localVideoEl: HTMLVideoElement;
	let remoteStream: MediaStream;
	let localStream: MediaStream;

	onMount(async () => {
		localStream = await navigator.mediaDevices.getUserMedia({
			video: true,
			audio: true,
		});

		localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
		localVideoEl.srcObject = localStream;
	});

	onDestroy(() => {
		localStream?.getTracks().forEach((track) => track.stop());
		remoteStream?.getTracks().forEach((track) => track.stop());
	});
</script>

<div class="container relative mt-8 aspect-video">
	<div class="absolute aspect-video w-full bg-black">
		<!-- eslint-disable-next-line svelte/valid-compile -->
		<!-- svelte-ignore a11y-media-has-caption -->
		<video bind:this={remoteVideoEl} />
	</div>
	<div class="absolute bottom-8 right-0 aspect-video w-64 bg-gray-600">
		<!-- eslint-disable-next-line svelte/valid-compile -->
		<!-- svelte-ignore a11y-media-has-caption -->
		<video bind:this={localVideoEl} />
	</div>
	<div class="absolute"></div>
</div>
