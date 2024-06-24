<script lang="ts">
	import { env } from '$env/dynamic/public';
	import AgoraRTC, {
		type IAgoraRTCRemoteUser,
		type ILocalAudioTrack,
		type ILocalVideoTrack,
	} from 'agora-rtc-sdk-ng';
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	const channel = data.teamId;
	const uid = Number.parseInt(data.uid);
	const token = data.token;
	console.log(token);

	let users: IAgoraRTCRemoteUser[] = [];
	let video: null | ILocalVideoTrack = null;
	let audio: null | ILocalAudioTrack = null;

	let selfVideo: HTMLDivElement;

	AgoraRTC.setLogLevel(1);
	const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

	const init = async () => {
		[audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks();
		video.play(selfVideo);

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

		await client.join(env.PUBLIC_AGORA_APP_ID, channel, token, uid);
		await client.publish([audio, video]);
	};

	const renderVideo = (_node: Node, user: IAgoraRTCRemoteUser) => {
		user.videoTrack?.play(String(user.uid));
	};

	const unit = 'minmax(0, 1fr) ';
	let innerWidth = 0;
	let innerHeight = 0;
	$: isLandscape = innerWidth > innerHeight;
	$: columnTemplate = isLandscape
		? users.length > 8
			? unit.repeat(4)
			: users.length > 3
				? unit.repeat(3)
				: users.length > 0
					? unit.repeat(2)
					: unit
		: users.length > 7
			? unit.repeat(3)
			: users.length > 1
				? unit.repeat(2)
				: unit;

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

<div class="container relative h-full min-h-96">
	<div class="grid" style="grid-template-columns: {columnTemplate}">
		{#each users as user (user.uid)}
			<div class="relative aspect-video">
				<div
					use:renderVideo={user}
					class="video size-full"
					id={String(user.uid)}
				></div>
				<p class="uid">{user.uid}</p>
			</div>
		{/each}
	</div>
	<div class="absolute bottom-10 right-10">
		<div class="aspect-video h-40 w-64" bind:this={selfVideo}></div>
		<p class="uid">me</p>
	</div>
</div>
