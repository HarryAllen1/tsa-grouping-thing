import { Timestamp } from 'firebase-admin/firestore';

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
	eventStatusCheckInEnabled?: boolean;
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
	checkInComplete?: boolean;
	preparationLevel?: string;
	preparationLevelDescription?: string;
	checkInSubmittedTime?: Timestamp;
	checkInSubmittedBy?: BasicUser;
	random?: boolean;
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
	tShirtSize?: string;
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
	locked?: boolean;
	eventsLocked?: boolean;
	lockRooming?: boolean;
}
