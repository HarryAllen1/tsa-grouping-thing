<script lang="ts">
	import {
		auth,
		closeConfirmationDialog,
		fancyConfirm,
		lookupMsAzureProfilePhoto,
		profilePhoto,
		yay,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import confetti from 'canvas-confetti';
	import {
		OAuthProvider,
		browserLocalPersistence,
		setPersistence,
		signInWithPopup,
		type AuthError,
	} from 'firebase/auth';

	const provider = new OAuthProvider('microsoft.com');
	provider.addScope('email');
	provider.addScope('openid');
	provider.addScope('profile');
</script>

<Card.Root class="mx-16 max-w-md md:mx-48 lg:mx-96">
	<Card.Header>
		<Card.Title>Login</Card.Title>
	</Card.Header>
	<Card.Content>
		<Button
			on:click={async () => {
				await setPersistence(auth, browserLocalPersistence);
				try {
					const user = await signInWithPopup(auth, provider);

					if (!user.user.email?.endsWith('@lwsd.org')) {
						alert('You must use an LWSD account to log in.');
						await user.user.delete();
					}

					if (user.user) {
						const credential = OAuthProvider.credentialFromResult(user);
						const accessToken = credential?.accessToken;
						$profilePhoto = await lookupMsAzureProfilePhoto(accessToken ?? '');
						confetti();
						yay.play();
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
	</Card.Content>
</Card.Root>
