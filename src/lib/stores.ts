import type { User } from 'firebase/auth';
import type { Readable } from 'svelte/store';
import { collectionStore, docStore, userStore } from 'sveltefire';
import { auth, db } from './firebase';
import type { EventDoc, SettingsDoc, UserDoc } from './types';

export const user = userStore(auth) as Readable<User>;
export let userDoc: ReturnType<typeof docStore<UserDoc>>;
export let allUsersCollection: ReturnType<typeof collectionStore<UserDoc>>;
export let eventsCollection: ReturnType<typeof collectionStore<EventDoc>>;
export let settings: ReturnType<typeof docStore<SettingsDoc>>;

await auth.authStateReady();
user.subscribe(($u) => {
	userDoc = docStore<UserDoc>(db, `users/${$u?.email}`);
	allUsersCollection = collectionStore<UserDoc>(db, 'users');
	eventsCollection = collectionStore<EventDoc>(db, 'events');
	settings = docStore<SettingsDoc>(db, 'settings/settings');
});
