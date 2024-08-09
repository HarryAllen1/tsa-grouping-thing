import { type User } from 'firebase/auth';
import { derived, writable, type Readable } from 'svelte/store';
import { collectionStore, docStore, userStore } from 'sveltefire';
import { auth, db } from './firebase';
import type { EventDoc, SettingsDoc, UserDoc } from './types';
import { persisted } from 'svelte-local-storage-store';

export const user = userStore(auth) as Readable<User>;
export let userDoc: Readable<UserDoc>;
export let allUsersCollection: Readable<UserDoc[]>;
export let eventsCollection: ReturnType<typeof collectionStore<EventDoc>>;
export let settings: ReturnType<typeof docStore<SettingsDoc>>;
export const profilePhoto = persisted('profile-photo', '');

await auth.authStateReady();
user.subscribe(async ($u) => {
	if ($u) {
		userDoc = derived(
			docStore<UserDoc>(db, `users/${$u?.email}`) as Readable<UserDoc>,
			($doc) => ({
				...$doc,
				name:
					$doc?.firstName && $doc?.lastName
						? `${$doc?.firstName} ${$doc?.lastName}`
						: $doc?.name,
			}),
		);
		allUsersCollection = derived(
			collectionStore<UserDoc>(db, 'users') as Readable<UserDoc[]>,
			($users) =>
				$users.map(($doc) => ({
					...$doc,
					name:
						$doc?.firstName && $doc?.lastName
							? `${$doc.firstName} ${$doc.lastName}`
							: $doc?.name,
				})),
		);
		eventsCollection = collectionStore<EventDoc>(db, 'events');
		settings = docStore<SettingsDoc>(db, 'settings/settings');
	}
});
