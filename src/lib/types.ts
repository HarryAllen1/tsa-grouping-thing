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
	results?: Result[];
	submissionDescription?: string;
	id: number;
	allowGenderMixing?: boolean;
}

export interface Result {
	members: BasicUser[];
	rubricPaths: string[];
	id: ReturnType<typeof crypto.randomUUID>;
	note?: string;
}

export interface Team {
	teamNumber: number;
	teamCaptain?: string;
	members: BasicUser[];
	locked?: boolean;
	lastUpdatedBy?: string;
	lastUpdatedTime?: Timestamp;
	requests?: BasicUser[];
	id: ReturnType<typeof crypto.randomUUID>;
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
	nationalId?: number;
	washingtonId?: number;
	grade?: number;
	firstName?: string;
	random?: boolean;
	lastName?: string;
	gender?: string;
	demographic?: string;
	tShirtSize?: string;
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
	enableRooming: boolean;
}

export interface EventData extends EventDoc {
	members: BasicUser[];
}
