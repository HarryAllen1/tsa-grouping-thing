import { writable } from 'svelte/store';

export const notificationPermission =
	writable<NotificationPermission>('default');
