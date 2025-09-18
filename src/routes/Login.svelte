<script lang="ts">
	import { dev } from '$app/environment';
	import {
		closeConfirmationDialog,
		fancyConfirm,
	} from '$lib/FancyConfirm.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import {
		POINT_OF_CONTACT_EMAIL,
		POINT_OF_CONTACT_NAME,
	} from '$lib/constants';
	import { auth } from '$lib/firebase';
	import { captureException } from '@sentry/sveltekit';
	import confetti from 'canvas-confetti';
	import {
		browserLocalPersistence,
		OAuthProvider,
		setPersistence,
		signInWithPopup,
		type AuthError,
	} from 'firebase/auth';

	const provider = new OAuthProvider('microsoft.com');

	// let email = $state('');
</script>

<Card.Root class="w-xs md:w-sm">
	<Card.Header>
		<Card.Title>Login</Card.Title>
	</Card.Header>
	<Card.Content>
		<!-- <h2 class="font-semibold">
			If you created an account before the 2024/25 school year:
		</h2> -->
		<Button
			onclick={async () => {
				await setPersistence(auth, browserLocalPersistence);
				try {
					const user = await signInWithPopup(auth, provider);

					if (
						!(
							user.user.email?.endsWith('@lwsd.org') ||
							user.user.email?.endsWith('@kampmusic.org') ||
							user.user.email?.endsWith('@kcl.ac.uk')
						) &&
						!dev
					) {
						alert('You must use an LWSD account to log in.');
						await user.user.delete();
					}

					if (user.user) {
						confetti();
						closeConfirmationDialog();
					}
				} catch (error: unknown) {
					const err = error as AuthError;
					captureException(err);
					switch (err.code) {
						case 'auth/canclled-popup-request':
						case 'auth/popup-blocked': {
							fancyConfirm(
								'Please enable popups for this site.',
								"An error with the login popup occurred. Make sure that you have popups enabled by clicking the window icon in the right of the address bar. If logging in still doesn't work, contact a JHS TSA board member.",
								[['Ok', true]],
							);
							break;
						}

						case 'auth/account-exists-with-different-credential': {
							fancyConfirm(
								'Account already exists',
								`It seems like you previously signed in with your email and are now trying to sign in with Microsoft. Unfortunately, you are now stuck with the email link. If this really bothers, you, please contact ${POINT_OF_CONTACT_NAME} at ${POINT_OF_CONTACT_EMAIL} to fix this. In the meantime, please login using your email.`,
							);
							break;
						}

						case 'auth/admin-restricted-operation': {
							fancyConfirm(
								'An account cannot be created at this time',
								'If you see this message and have an account, please try logging in with email.',
							);
							break;
						}

						default: {
							fancyConfirm(
								'An error occurred while logging in.',
								`Please try again or contact a JHS TSA board member for assistance. (error code/message: ${err.message})`,
								[['Ok', true]],
							);
							break;
						}
					}
				}
			}}
			class="mt-4"
		>
			<svg
				height="100%"
				viewBox="0 0 20 20"
				width="100%"
				class="mr-2 aspect-square bg-white p-[1px]"
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
		<!-- <h2 class="my-2 font-semibold">Otherwise, sign in with email</h2>
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
					await fancyConfirm(
						'Invalid email',
						'Please use your new email (starting with your 7-digit student ID).',
						[['Ok', true]],
					);
					return;
				}

				await sendSignInLinkToEmail(auth, email, {
					url: `${page.url.origin}/email-link`,
					handleCodeInApp: true,
				});

				localStorage.setItem('jhs-tsa-sign-in-email', email);
				email = '';

				await fancyConfirm(
					'Check your email',
					'We sent you a link to sign in. <span class="text-destructive">If you do not see it, check your spam folder.</span> This email can take up to 5 minutes to show up. This email will be from <b>noreply@jhstsa.org</b>.',
					[['Ok', true]],
				);
			}}
		>
			<div class="grid w-full items-center gap-1.5">
				<Label for="email">Email</Label>
				<Input
					type="email"
					id="email"
					bind:value={email}
					placeholder="1234567@lwsd.org"
				/>
			</div>

			<Button type="submit" class="self-end">Log in</Button>
		</form> -->
	</Card.Content>
	<Card.Footer class="text-muted-foreground">
		If any nontrivial error occurs when logging in, please contact a JHS TSA
		Board Member.
	</Card.Footer>
</Card.Root>
