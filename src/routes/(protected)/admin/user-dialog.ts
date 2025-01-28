import { allUsersCollection } from '$lib/stores';
import type { UserDoc } from '$lib/types';
import { get, writable } from 'svelte/store';

export const openUserDialog = (email: string) => {
	currentUserDialogUser.set(
		get(allUsersCollection).find((user) => user.email === email),
	);
	userDialogOpen.set(true);
};

export const userDialogOpen = writable(false);
export const currentUserDialogUser = writable<UserDoc | undefined>();
