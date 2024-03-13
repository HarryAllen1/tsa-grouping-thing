<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { db } from '$lib';
	import { servers } from '$lib/calling';
	import { Button } from '$lib/components/ui/button';
	import {
		DocumentReference,
		doc,
		getDoc,
		setDoc,
		type DocumentData,
		collection,
		addDoc,
		onSnapshot,
		CollectionReference,
		updateDoc,
		deleteDoc,
	} from 'firebase/firestore';
	import PhoneMissed from 'lucide-svelte/icons/phone-missed';
	import { onDestroy, onMount } from 'svelte';

	const pc = new RTCPeerConnection(servers);
	let remoteVideoEl: HTMLVideoElement;
	let localVideoEl: HTMLVideoElement;
	let remoteStream: MediaStream;
	let localStream: MediaStream;

	const createCall = async (
		callDocRef: DocumentReference<DocumentData, DocumentData>,
		offerCandidates: CollectionReference<DocumentData>,
		answerCandidates: CollectionReference<DocumentData>,
	) => {
		console.log('create');

		pc.addEventListener('icecandidate', (event) => {
			if (event.candidate) addDoc(offerCandidates, event.candidate.toJSON());
		});

		const offerDescription = await pc.createOffer();
		await pc.setLocalDescription(offerDescription);

		setDoc(callDocRef, {
			offer: {
				type: offerDescription.type,
				sdp: offerDescription.sdp,
			},
		});

		onSnapshot(callDocRef, (ss) => {
			const data = ss.data();

			if (!pc.currentRemoteDescription && data?.answer) {
				const answerDescription = new RTCSessionDescription(data.answer);
				pc.setRemoteDescription(answerDescription);
			}
		});

		onSnapshot(answerCandidates, (ss) => {
			ss.docChanges().forEach((change) => {
				if (change.type === 'added') {
					const candidate = new RTCIceCandidate(change.doc.data());
					pc.addIceCandidate(candidate);
				}
			});
		});
	};

	const stopVideo = () => {
		localStream?.getTracks().forEach((track) => track.stop());
		remoteStream?.getTracks().forEach((track) => track.stop());
	};

	const joinCall = async (
		callDocRef: DocumentReference<DocumentData, DocumentData>,
		offerCandidates: CollectionReference<DocumentData>,
		answerCandidates: CollectionReference<DocumentData>,
	) => {
		console.log('join');
		pc.addEventListener('icecandidate', (event) => {
			if (event.candidate) addDoc(answerCandidates, event.candidate.toJSON());
		});

		const callData = (await getDoc(callDocRef)).data();

		const offerDescription = callData?.offer;
		await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

		const answerDescription = await pc.createAnswer();
		await pc.setLocalDescription(answerDescription);

		await updateDoc(callDocRef, {
			answer: {
				type: answerDescription.type,
				sdp: answerDescription.sdp,
			},
		});

		onSnapshot(offerCandidates, (ss) => {
			ss.docChanges().forEach((change) => {
				if (change.type === 'added') {
					pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
				}
			});
		});
	};

	onMount(async () => {
		localStream = await navigator.mediaDevices.getUserMedia({
			video: {
				width: 1280,
				height: 720,
			},
			audio: true,
			peerIdentity: 'user',
		});

		localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

		if (localVideoEl) localVideoEl.srcObject = localStream;

		remoteStream = new MediaStream();

		// Pull tracks from remote stream, add to video stream
		pc.addEventListener('track', (event) => {
			event.streams[0].getTracks().forEach((track) => {
				remoteStream.addTrack(track);
			});
		});

		if (remoteVideoEl) remoteVideoEl.srcObject = remoteStream;

		const callDocRef = doc(db, 'calls', $page.params.teamId);
		const callDoc = await getDoc(callDocRef);
		const offerCandidates = collection(
			db,
			'calls',
			callDocRef.id,
			'offerCandidates',
		);
		const answerCandidates = collection(
			db,
			'calls',
			callDocRef.id,
			'answerCandidates',
		);
		if (callDoc.exists())
			joinCall(callDocRef, offerCandidates, answerCandidates);
		else createCall(callDocRef, offerCandidates, answerCandidates);
	});

	onDestroy(stopVideo);
</script>

<div class="container relative mt-8 aspect-video lg:mx-16">
	<div class="absolute aspect-video w-full max-w-[calc(100%-4rem)] bg-black">
		<!-- eslint-disable-next-line svelte/valid-compile -->
		<!-- svelte-ignore a11y-media-has-caption -->
		<video autoplay bind:this={remoteVideoEl} class="h-full w-full" />
	</div>
	<div class="absolute bottom-16 right-12 aspect-video w-64 bg-gray-600">
		<video class="h-full w-full" muted autoplay bind:this={localVideoEl} />
	</div>
	<div class="absolute"></div>
</div>
<div class="container flex justify-center">
	<Button
		on:click={async () => {
			await deleteDoc(doc(db, 'calls', $page.params.teamId));

			stopVideo();

			goto('/');
		}}
		size="lg"
		class="aspect-square p-2"
		variant="destructive"
	>
		<PhoneMissed />
	</Button>
</div>
