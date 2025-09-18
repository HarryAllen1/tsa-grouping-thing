import { setUser } from '@sentry/sveltekit';
import { setUserId } from 'firebase/analytics';
import { type User } from 'firebase/auth';
import { persisted } from 'svelte-persisted-store';
import { derived, get, type Readable } from 'svelte/store';
import { collectionStore, docStore, userStore } from 'sveltefire';
import { analytics, auth, db } from './firebase';
import type { EventDoc, SettingsDoc, UserDoc } from './types';

export const user = userStore(auth) as Readable<User>;
export let userDoc: Readable<UserDoc>;
export let allUsersCollection: Readable<UserDoc[]>;
export let eventsCollection: ReturnType<typeof collectionStore<EventDoc>>;
export let settings: ReturnType<typeof docStore<SettingsDoc>>;
export const profilePhoto = persisted('profile-photo', '');

user.subscribe(async ($u) => {
	if ($u !== null && $u.email) {
		userDoc = derived(
			docStore<UserDoc>(db, `users/${$u?.email}`) as Readable<UserDoc>,
			($doc) => ({
				...$doc,
				admin: !!$doc?.admin,
				random: !!$doc?.random,
				name:
					$doc?.firstName && $doc?.lastName
						? `${$doc.preferredFirstName ? `${$doc.preferredFirstName.trim()} (${$doc.firstName.trim()})` : $doc?.firstName.trim()} ${$doc?.lastName.trim()}`
						: $doc?.name.trim(),
			}),
		);
		setUser(get(userDoc));
		setUserId(analytics, $u.email);
		allUsersCollection = derived(
			collectionStore<UserDoc>(db, 'users') as Readable<UserDoc[]>,
			($users) =>
				$users
					.filter(
						(u) =>
							![
								'harry@kampmusic.org',
								'1036145@lwsd.org',
								'harryall@uw.edu',
							].includes(u.email),
					)
					.map(($doc) => ({
						...$doc,
						// allow confirmation check
						admin: !!$doc?.admin,
						random: !!$doc?.random,
						name:
							$doc?.firstName && $doc?.lastName
								? `${$doc.preferredFirstName ? `${$doc.preferredFirstName.trim()} (${$doc.firstName.trim()})` : $doc?.firstName.trim()} ${$doc?.lastName.trim()}`
								: $doc?.name.trim(),
					})),
		);
		eventsCollection = collectionStore<EventDoc>(db, 'events');
		settings = docStore<SettingsDoc>(db, 'settings/settings', {
			enableOnlineSubmissions: false,
			alert: '',
			openAIAPIKey: '',
			lockAccounts: false,
			chapterId: '',
		});
	}
});
