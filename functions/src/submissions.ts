import { getStorage } from 'firebase-admin/storage';
import { HttpsError, onCall } from 'firebase-functions/https';
import { getAuthUser, getEvent, logFunctionCall } from './utils';

export const deleteSubmissionFile = onCall<
	{
		event: string;
		teamId: string;
		fileName: string;
	},
	Promise<{
		success: boolean;
	}>
>(
	{
		region: 'us-west1',
	},
	async ({ auth, data }) => {
		const { user } = await getAuthUser(auth);
		const { event } = await getEvent(data.event);

		// Find the team the user is trying to delete from
		const team = event.teams.find((t) => t.id === data.teamId);

		if (!team) {
			throw new HttpsError('not-found', 'Team not found');
		}

		// Verify the user is a member of this team
		const isMember = team.members.some((m) => m.email === user.email);

		if (!isMember) {
			throw new HttpsError(
				'permission-denied',
				'You must be a member of this team to delete files',
			);
		}

		// Delete the file from storage
		const storage = getStorage();
		const bucket = storage.bucket();
		const filePath = `submissions/${data.event}/${data.teamId}/${data.fileName}`;

		try {
			await bucket.file(filePath).delete();

			await logFunctionCall('deleteSubmissionFile', user, data);

			return {
				success: true,
			};
		} catch (error) {
			throw new HttpsError(
				'internal',
				`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		}
	},
);
