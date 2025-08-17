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

export const leaveTeam = httpsCallable<
	{
		event: string;
		teamId: string;
	},
	BasicResponse
>(functions, 'leaveTeam');
export const addTeamMember = httpsCallable<
	{
		event: string;
		teamId: string;
		userEmail: string;
	},
	BasicResponse
>(functions, 'addTeamMember');
export const becomeTeamCaptain = httpsCallable<
	{
		event: string;
		teamId: string;
	},
	BasicResponse
>(functions, 'becomeTeamCaptain');
export const createTeam = httpsCallable<
	{
		event: string;
	},
	BasicResponse
>(functions, 'createTeam');
export const editCardboardBoatTeamName = httpsCallable<
	{
		teamId: string;
		name: string;
	},
	BasicResponse
>(functions, 'editCardboardBoatTeamName');
export const saveCheckIn = httpsCallable<
	| {
			preparationLevel: 1 | 2 | 3 | 4;
			preparationLevelDescription: string;
			event: string;
			teamId: string;
			markAsComplete: true;
	  }
	| {
			preparationLevel?: 1 | 2 | 3 | 4;
			preparationLevelDescription?: string;
			event: string;
			teamId: string;
			markAsComplete?: false;
	  },
	BasicResponse
>(functions, 'saveCheckIn');
