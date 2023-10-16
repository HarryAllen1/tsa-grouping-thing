import type { DocumentData, Timestamp } from 'firebase/firestore';

export const correctTeamsDataType = (data: DocumentData[string]) =>
	data as {
		members: { name: string; email: string }[];
		teamCaptain?: string;
		lastUpdatedBy?: string;
		lastUpdatedTime?: Timestamp;
	}[];

export const correctDocType = (data: DocumentData) =>
	data as {
		teams: {
			members: { name: string; email: string }[];
			teamCaptain?: string;
			lastUpdatedBy?: string;
			lastUpdatedTime?: Timestamp;
		}[];
	};
