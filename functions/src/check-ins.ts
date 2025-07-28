import { onCall } from 'firebase-functions/https';

export const saveCheckIn = onCall<
	{
		preparationLevel: 1 | 2 | 3 | 4;
		preparationLevelDescription: string;
		event: string;
		teamId: string;
		markAsComplete?: boolean;
	},
	Promise<{ success: boolean }>
>(
	{
		region: 'us-west1',
	},
	async () => {
		return {
			success: true,
		};
	},
);
