import type { ParsedToken, User } from 'firebase/auth';
import { derived, get, type Readable } from 'svelte/store';
import { collectionStore, docStore, userStore } from 'sveltefire';
import { auth, db } from './firebase';
import type { EventDoc, UserDoc } from './types';

export const user = derived(userStore(auth), ($u, set) => {
	$u?.getIdTokenResult().then((idTokenResult) => {
		set({
			...$u,
			claims: idTokenResult.claims,
		});
	});
}) as Readable<User & { claims: ParsedToken }>;
export let userDoc = docStore<UserDoc>(db, `users/${get(user)?.email}`);
export let allUsersCollection = collectionStore<UserDoc>(db, 'users');
export let eventsCollection = collectionStore<EventDoc>(db, 'events');

user.subscribe(($u) => {
	userDoc = docStore<UserDoc>(db, `users/${$u?.email}`);
	allUsersCollection = collectionStore<UserDoc>(db, 'users');
	eventsCollection = collectionStore<EventDoc>(db, 'events');
});
