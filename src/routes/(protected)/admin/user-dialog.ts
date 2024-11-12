import { get, writable } from 'svelte/store';
import { allUsersCollection, type UserDoc } from '$lib';

export const openUserDialog = (email: string) => {
	currentUserDialogUser.set(
		get(allUsersCollection).find((user) => user.email === email),
	);
	userDialogOpen.set(true);
};

export const userDialogOpen = writable(false);
export const currentUserDialogUser = writable<UserDoc | undefined>();
