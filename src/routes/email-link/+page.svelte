<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth, fancyConfirm } from '$lib';
	import confetti from 'canvas-confetti';
	import {
		isSignInWithEmailLink,
		signInWithEmailLink,
		type AuthError,
	} from 'firebase/auth';
	import { onMount } from 'svelte';

	onMount(async () => {
		if (auth.currentUser) {
			goto('/');
			return;
		}
		if (isSignInWithEmailLink(auth, $page.url.href) && !auth.currentUser) {
			const email =
				localStorage.getItem('jhs-tsa-sign-in-email') ??
				prompt(
					'It looks like you clicked this link on a different device. Please enter your email address:',
				) ??
				'';

			if (!email.endsWith('@lwsd.org')) {
				await fancyConfirm(
					'Invalid email',
					'You must use an LWSD email address to log in.',
					[['Ok', true]],
				);
				return;
			}

			await signInWithEmailLink(auth, email, $page.url.href).catch((error) => {
				const err = error as AuthError;
				if (err.code === 'auth/expired-action-code') {
					fancyConfirm(
						'Link expired',
						'The link you clicked has expired. Please request a new one.',
						[['Ok', true]],
					);
				} else {
					fancyConfirm(
						'An error occurred while logging in.',
						`Please try again or contact a board member for assistance. (error code/message: ${err.message})`,
						[['Ok', true]],
					);
				}
			});
			localStorage.removeItem('jhs-tsa-sign-in-email');
			confetti();
			goto('/');
		}
	});
</script>

<svelte:head>
	<title>Logging in... — JHS TSA Teaming</title>
</svelte:head>

Logging you in...
