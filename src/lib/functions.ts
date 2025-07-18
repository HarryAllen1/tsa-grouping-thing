import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

interface BasicResponse {
	success: boolean;
}

export const sendRequest = httpsCallable<
	{ event: string; teamId: string },
	BasicResponse
>(functions, 'sendRequest');
export const sendRequestApproval = httpsCallable<
	{ event: string; teamId: string; userEmail: string },
	BasicResponse
>(functions, 'sendRequestApproval');
export const sendRequestDenial = httpsCallable<
	{ event: string; teamId: string; userEmail: string },
	BasicResponse
>(functions, 'sendRequestDenial');
