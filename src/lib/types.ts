import type { Timestamp } from 'firebase/firestore';
import { tShirtMap } from './t-shirt';

export interface EventDoc {
	teams: Team[];
	id: number;
	event: string;
	minTeamSize: number;
	maxTeamSize: number;
	perChapter: number;
	description?: string;
	locked?: boolean;
	onlineSubmissions?: boolean;
	teamCreationLocked?: boolean;
	results?: Result[];
	submissionDescription?: string;
	allowGenderMixing?: boolean;
	showToEveryone?: boolean;
	hideInSignup?: boolean;
	teamCreationActuallyLocked?: boolean;
	lastUpdatedBy?: string;
}

export interface Result {
	members: BasicUser[];
	/** @deprecated */
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
	cardboardBoatOnlyPeopleInBoat?: BasicUser[];
	teamName?: string;
	messages?: Message[];
}

export interface SimpleMessage {
	content: string;
	time: Timestamp;
	sender: BasicUser;
}

export interface Message extends SimpleMessage {
	id: ReturnType<typeof crypto.randomUUID>;
	reactions: (BasicUser & { reaction: string })[];
	readBy: BasicUser[];
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
	tShirtSize?: typeof tShirtMap extends Map<infer K, unknown> ? K : never;
	grade?: number;
	firstName?: string;
	preferredFirstName?: string;
	random?: boolean;
	lastName?: string;
	gender?: string;
	demographic?: string;
	completedIntakeForm?: boolean;
	studentId?: number;
	foundBy?: string;
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
	alert: string;
	openAIAPIKey: string;
}

export interface EventData extends EventDoc {
	members: BasicUser[];
}
