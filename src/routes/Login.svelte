<script lang="ts">
	import { page } from '$app/state';
	import { fancyConfirm } from '$lib/FancyConfirm.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { auth } from '$lib/firebase';
	import { captureException } from '@sentry/sveltekit';
	import { sendSignInLinkToEmail } from 'firebase/auth';

	let email = $state('');

	const sendMagicLink = async () => {
		const normalizedEmail = email.trim().toLowerCase();

		if (!normalizedEmail.endsWith('@lwsd.org')) {
			await fancyConfirm(
				'Invalid email',
				'You must use an LWSD email address to log in.',
				[['Ok', true]],
			);
			return;
		}

		if (normalizedEmail.startsWith('s-')) {
			await fancyConfirm(
				'Invalid email',
				'Please use your new email address, starting with your 7-digit student ID.',
				[['Ok', true]],
			);
			return;
		}

		try {
			await sendSignInLinkToEmail(auth, normalizedEmail, {
				url: `${page.url.origin}/email-link`,
				handleCodeInApp: true,
			});

			localStorage.setItem('jhs-tsa-sign-in-email', normalizedEmail);
			email = '';
			await fancyConfirm(
				'Check your email',
				'We sent a sign-in link to your email. If you do not see it, check your spam folder. The email may take up to five minutes to arrive and will be from <b>noreply@jhstsa.org</b>.',
				[['Ok', true]],
			);
		} catch (error: unknown) {
			captureException(error);
			await fancyConfirm(
				'Unable to send sign-in link',
				'Please try again or contact a JHS TSA Board Member for assistance.',
				[['Ok', true]],
			);
		}
	};
</script>

<Card.Root class="w-xs md:w-sm">
	<Card.Header>
		<Card.Title>Login</Card.Title>
	</Card.Header>
	<Card.Content>
		<form
			class="flex flex-col gap-2"
			onsubmit={(event) => {
				event.preventDefault();
				void sendMagicLink();
			}}
		>
			<div class="grid w-full items-center gap-1.5">
				<Label for="email">LWSD email</Label>
				<Input
					type="email"
					id="email"
					bind:value={email}
					placeholder="1234567@lwsd.org"
					autocomplete="email"
					required
				/>
			</div>

			<Button type="submit" class="self-end">Email me a sign-in link</Button>
		</form>
	</Card.Content>
	<Card.Footer class="text-muted-foreground">
		If any nontrivial error occurs when logging in, please contact a JHS TSA
		Board Member.
	</Card.Footer>
</Card.Root>
