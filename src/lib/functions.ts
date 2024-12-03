import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

interface BasicResponse {
	success: boolean;
}

export const setEvents = httpsCallable<
	{
		events: string[];
		user: string;
	},
	BasicResponse
>(functions, 'setEvents');
