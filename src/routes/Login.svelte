<script lang="ts">
	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth, closeConfirmationDialog, fancyConfirm } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import confetti from 'canvas-confetti';
	import {
		OAuthProvider,
		browserLocalPersistence,
		isSignInWithEmailLink,
		sendSignInLinkToEmail,
		setPersistence,
		signInWithEmailLink,
		signInWithPopup,
		type AuthError,
	} from 'firebase/auth';
	import { onMount } from 'svelte';

	const provider = new OAuthProvider('microsoft.com');
	provider.addScope('email');
	provider.addScope('openid');
	provider.addScope('profile');

	let email = $state('');

	onMount(async () => {
		if (isSignInWithEmailLink(auth, $page.url.href)) {
			email =
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

			const user = await signInWithEmailLink(auth, email, $page.url.href);
			localStorage.removeItem('jhs-tsa-sign-in-email');
			console.log(user);
			confetti();
			goto('/');
		}
	});
</script>

<Card.Root class="mx-16 max-w-md md:mx-48 lg:mx-96">
	<Card.Header>
		<Card.Title>Login</Card.Title>
	</Card.Header>
	<Card.Content>
		<h2 class="font-semibold">
			If you created an account before the 2024/25 school year:
		</h2>
		<Button
			on:click={async () => {
				await setPersistence(auth, browserLocalPersistence);
				try {
					const user = await signInWithPopup(auth, provider);

					if (!user.user.email?.endsWith('@lwsd.org') && !dev) {
						alert('You must use an LWSD account to log in.');
						await user.user.delete();
					}

					if (user.user) {
						confetti();
						closeConfirmationDialog();
					}
				} catch (error: unknown) {
					const err = error as AuthError;
					if (
						['auth/cancelled-popup-request', 'auth/popup-blocked'].includes(
							err.code,
						)
					) {
						fancyConfirm(
							'Please enable popups for this site.',
							"An error with the login popup occurred. Make sure that you have popups enabled by clicking the window icon in the right of the address bar. If logging in still doesn't work, contact a board member.",
							[['Ok', true]],
						);
					} else
						fancyConfirm(
							'An error occurred while logging in.',
							`Please try again or contact a board member for assistance. (error code/message: ${err.message})`,
							[['Ok', true]],
						);
				}
			}}
			class="mt-4"
		>
			<svg
				height="100%"
				viewBox="0 0 20 20"
				width="100%"
				class="mr-4 aspect-square bg-white p-[1px]"
				preserveAspectRatio="xMidYMid meet"
				focusable="false"
			>
				<g fill="none">
					<path d="M0 0h9.504v9.504H0z" fill="#F25022" />
					<path d="M10.496 0H20v9.504h-9.504z" fill="#7FBA00" />
					<path d="M0 10.496h9.504V20H0z" fill="#00A4EF" />
					<path d="M10.496 10.496H20V20h-9.504z" fill="#FFB900" />
				</g>
			</svg>
			Sign in with Microsoft
		</Button>
		<h2 class="my-2 font-semibold">Otherwise, sign in with email</h2>
		<form
			class="flex flex-col gap-2"
			onsubmit={async (e) => {
				e.preventDefault();

				if (!email.endsWith('@lwsd.org')) {
					await fancyConfirm(
						'Invalid email',
						'You must use an LWSD email address to log in.',
						[['Ok', true]],
					);
					return;
				}

				if (email.startsWith('s-')) {
					await fancyConfirm('Invalid email', 'Please use your new email.', [
						['Ok', true],
					]);
					return;
				}

				await sendSignInLinkToEmail(auth, email, {
					url: $page.url.origin,
					handleCodeInApp: true,
				});

				localStorage.setItem('jhs-tsa-sign-in-email', email);

				await fancyConfirm(
					'Check your email',
					'We sent you a link to sign in. If you do not see it, check your spam folder.',
					[['Ok', true]],
				);
			}}
		>
			<div class="grid w-full max-w-sm items-center gap-1.5">
				<Label for="email">Email</Label>
				<Input
					type="email"
					id="email"
					bind:value={email}
					placeholder="1234567@lwsd.org"
				/>
			</div>

			<Button type="submit" class="self-end">Log in</Button>
		</form>
	</Card.Content>
</Card.Root>
