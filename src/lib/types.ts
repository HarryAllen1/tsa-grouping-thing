import type { Timestamp } from 'firebase/firestore';

export interface EventDoc {
	teams: Team[];
	locked?: boolean;
	event: string;
	minTeamSize: number;
	maxTeamSize: number;
	onlineSubmissions?: boolean;
	perChapter: number;
	teamCreationLocked?: boolean;
	results: Result[];
	submissionDescription?: string;
}

export interface Result {
	members: BasicUser[];
	place: number;
	rubricPaths: string[];
}

export interface Team {
	teamCaptain?: string;
	members: BasicUser[];
	locked?: boolean;
	lastUpdatedBy?: string;
	lastUpdatedTime?: Timestamp;
	requests?: BasicUser[];
	id: string;
}

export interface BasicUser {
	name: string;
	email: string;
}

export interface UserDoc {
	email: string;
	name: string;
	events: string[];
	admin?: boolean;
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

export interface SettingsDoc {
	enableOnlineSubmissions: boolean;
}
