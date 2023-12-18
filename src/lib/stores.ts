import type { ParsedToken, User } from 'firebase/auth';
import { derived, type Readable } from 'svelte/store';
import { collectionStore, docStore, userStore } from 'sveltefire';
import { auth, db } from './firebase';
import type { EventDoc, SettingsDoc, UserDoc } from './types';

export const user = derived(userStore(auth), ($u, set) => {
	$u?.getIdTokenResult().then((idTokenResult) => {
		set({
			...$u,
			claims: idTokenResult.claims,
		});
	});
}) as Readable<User & { claims: ParsedToken }>;
export let userDoc: ReturnType<typeof docStore<UserDoc>>;
export let allUsersCollection: ReturnType<typeof collectionStore<UserDoc>>;
export let eventsCollection: ReturnType<typeof collectionStore<EventDoc>>;
export let settings: ReturnType<typeof docStore<SettingsDoc>>;

auth.authStateReady().then(() => {
	user.subscribe(($u) => {
		userDoc = docStore<UserDoc>(db, `users/${$u?.email}`);
		allUsersCollection = collectionStore<UserDoc>(db, 'users');
		eventsCollection = collectionStore<EventDoc>(db, 'events');
		settings = docStore<SettingsDoc>(db, 'settings/settings');
	});
});
