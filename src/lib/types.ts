import type { DocumentData, Timestamp } from 'firebase/firestore';

export const correctTeamsDataType = (data: DocumentData[string]) =>
	data as Team[];

export const correctDocType = (data: DocumentData) => data as EventDoc;

export interface EventDoc {
	teams: Team[];
	locked?: boolean;
	event: string;
	minTeamSize: number;
	maxTeamSize: number;
	perChapter: number;
}

export interface Team {
	teamCaptain?: string;
	members: BasicUser[];
	locked?: boolean;
	lastUpdatedBy?: string;
	lastUpdatedTime?: Timestamp;
	requests?: BasicUser[];
}

export interface BasicUser {
	name: string;
	email: string;
}

export interface UserDoc {
	email: string;
	name: string;
	events: string[];
}

export interface MailDoc {
	to: string[];
	message: {
		subject: string;
		html?: string;
		text?: string;
	};
	delivery?: {
		attempts: number;
		endTime?: Timestamp;
		error?: string;
		// ...
		state: string;
	};
}
