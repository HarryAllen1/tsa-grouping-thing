import type { DocumentData, Timestamp } from 'firebase/firestore';

export const correctTeamsDataType = (data: DocumentData[string]) =>
	data as Team[];

export const correctDocType = (data: DocumentData) => data as EventDoc;

export interface EventDoc {
	teams: Team[];
	locked?: boolean;
}

export interface Team {
	teamCaptain?: string;
	members: { name: string; email: string }[];
	lastUpdatedBy?: string;
	lastUpdatedTime?: Timestamp;
}

export interface UserDoc {
	email: string;
	name: string;
	events: string[];
}
