import type { User } from 'firebase/auth';
import { derived, type Readable } from 'svelte/store';
import { collectionStore, docStore, userStore } from 'sveltefire';
import { auth, db } from './firebase';
import type { EventDoc, SettingsDoc, UserDoc } from './types';

export const user = userStore(auth) as Readable<User>;
export let userDoc: Readable<UserDoc>;
export let allUsersCollection: Readable<UserDoc[]>;
export let eventsCollection: ReturnType<typeof collectionStore<EventDoc>>;
export let settings: ReturnType<typeof docStore<SettingsDoc>>;

await auth.authStateReady();
user.subscribe(($u) => {
	userDoc = derived(
		docStore<UserDoc>(db, `users/${$u?.email}`) as Readable<UserDoc>,
		($u) => ({
			...$u,
			name:
				$u.firstName && $u.lastName
					? `${$u?.firstName} ${$u?.lastName}`
					: $u.name,
		}),
	);
	allUsersCollection = derived(
		collectionStore<UserDoc>(db, 'users') as Readable<UserDoc[]>,
		($users) =>
			$users.map(($u) => ({
				...$u,
				name:
					$u.firstName && $u.lastName
						? `${$u.firstName} ${$u.lastName}`
						: $u.name,
			})),
	);
	eventsCollection = collectionStore<EventDoc>(db, 'events');
	settings = docStore<SettingsDoc>(db, 'settings/settings');
});
