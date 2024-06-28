<script lang="ts">
	import { PUBLIC_AGORA_APP_ID } from '$env/static/public';
	import { eventsCollection } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import AgoraRTC, {
		type IAgoraRTCRemoteUser,
		type ILocalAudioTrack,
		type ILocalVideoTrack,
	} from 'agora-rtc-sdk-ng';
	import Mic from 'lucide-svelte/icons/mic';
	import MicOff from 'lucide-svelte/icons/mic-off';
	import Video from 'lucide-svelte/icons/video';
	import VideoOff from 'lucide-svelte/icons/video-off';
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { rerender } from './rerender';

	let {
		data,
	}: {
		data: PageData;
	} = $props();

	const channel = data.teamId;
	const uid = Number.parseInt(data.uid);
	const token = data.token;

	let users = $state<IAgoraRTCRemoteUser[]>([]);
	let mountTime = Date.now();
	let video: null | ILocalVideoTrack = null;
	let audio: null | ILocalAudioTrack = null;
	let localVideoStatus = $state(true);
	let localAudioStatus = $state(true);
	$effect(() => {
		video;
		localVideoStatus;
		video?.setEnabled(localVideoStatus);
		if (localVideoStatus && Date.now() - mountTime > 1000) {
			$rerender = Date.now();
		}
	});
	$effect(() => {
		audio;
		localAudioStatus;
		audio?.setMuted(!localAudioStatus);
	});

	let selfVideo = $state<HTMLDivElement>();
	let otherSelfVideo = $state<HTMLDivElement>();

	AgoraRTC.setLogLevel(2);
	const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

	const init = async () => {
		[audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks();
		video.play(selfVideo!);
		const videoClone = video.clone();
		videoClone.play(otherSelfVideo!);

		client.on('user-published', async (user, type) => {
			if (type === 'audio') {
				await client.subscribe(user, 'audio');
				user.audioTrack?.play();
			} else if (type === 'video') {
				await client.subscribe(user, 'video');
				users.push(user);
			}
		});

		client.on('user-left', (u) => {
			users = users.filter((user) => user.uid !== u.uid);
		});

		await client.join(PUBLIC_AGORA_APP_ID, channel, token, uid);
		await client.publish([audio, video]);
	};

	const renderVideo = (_node: Node, user: IAgoraRTCRemoteUser) => {
		user.videoTrack?.play(String(user.uid));
	};

	const unit = 'minmax(0, 1fr) ';
	let innerWidth = $state(0);
	let innerHeight = $state(0);
	let isLandscape = $derived(innerWidth > innerHeight);
	let columnTemplate = $derived(
		isLandscape
			? users.length > 8
				? unit.repeat(4)
				: users.length > 3
					? unit.repeat(3)
					: users.length > 1
						? unit.repeat(2)
						: unit
			: users.length > 7
				? unit.repeat(3)
				: users.length > 1
					? unit.repeat(2)
					: unit,
	);

	onMount(init);
	onDestroy(() => {
		for (const user of users) {
			user.videoTrack?.stop();
			user.audioTrack?.stop();
		}
		users = [];
		audio?.close();
		video?.close();
		client.leave();
		client.removeAllListeners();
	});
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div class="container relative h-full min-h-96 py-8">
	<div
		class="grid gap-2"
		style="grid-template-columns: {columnTemplate}"
		class:mx-8={users.length < 2}
	>
		{#each users as user (user.uid)}
			{@const team = $eventsCollection
				.find((e) => e.event === data.event)
				?.teams.find((t) => t.id === data.teamId)}
			<div class="relative aspect-video">
				<div
					use:renderVideo={user}
					class="video size-full [&>div]:rounded-md"
					id={String(user.uid)}
				></div>
				<p
					class="absolute bottom-1 left-1 w-fit rounded-sm bg-black bg-opacity-50 px-2 py-1"
				>
					{team?.members[Number(user.uid)].name}
				</p>
			</div>
		{/each}
		<div class:hidden={users.length > 0} class="relative">
			<div
				class="relative aspect-video [&>div]:rounded-md"
				bind:this={selfVideo}
			></div>
			<p
				class="absolute bottom-1 left-1 w-fit rounded-sm bg-black bg-opacity-50 px-2 py-1"
			>
				You
			</p>
		</div>
	</div>
</div>
<div
	class="fixed bottom-56 flex w-full flex-row items-center justify-center gap-4 lg:bottom-8"
>
	<Button
		class="size-16"
		size="icon"
		on:click={() => (localAudioStatus = !localAudioStatus)}
	>
		{#if localAudioStatus}
			<Mic class="size-8" />
		{:else}
			<MicOff class="size-8" />
		{/if}
	</Button>
	<Button
		class="size-16"
		size="icon"
		on:click={() => (localVideoStatus = !localVideoStatus)}
	>
		{#if localVideoStatus}
			<Video class="size-8" />
		{:else}
			<VideoOff class="size-8" />
		{/if}
	</Button>
</div>
<div
	class="fixed bottom-8 flex w-full items-center justify-center lg:right-32 lg:w-auto"
	class:hidden={users.length === 0 || !localVideoStatus}
>
	<div class="relative">
		<div
			class="aspect-video h-40 w-64 [&>div]:rounded-md"
			bind:this={otherSelfVideo}
		></div>
		<p
			class="absolute bottom-1 left-1 w-fit rounded-sm bg-black bg-opacity-50 px-2 py-1"
		>
			You
		</p>
	</div>
</div>
