import { onCall } from 'firebase-functions/https';

export const leaveTeam = onCall<{
	event: string;
	teamId: string;
}>(
	{
		region: 'us-west1',
	},
	({ auth, data }) => {},
);

export const addTeamMember = onCall<{
	event: string;
	teamId: string;
	userEmail: string;
}>(
	{
		region: 'us-west1',
	},
	({ auth, data }) => {},
);

export const becomeTeamCaptain = onCall<{
	event: string;
	teamId: string;
}>(
	{
		region: 'us-west1',
	},
	({ auth, data }) => {},
);

export const createTeam = onCall<{
	event: string;
}>(
	{
		region: 'us-west1',
	},
	({ auth, data }) => {},
);
