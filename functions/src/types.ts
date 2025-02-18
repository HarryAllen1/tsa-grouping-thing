export interface EventDoc {
	teams: unknown[];
	id: number;
	event: string;
	minTeamSize: number;
	maxTeamSize: number;
	perChapter: number;
	description?: string;
	locked?: boolean;
	onlineSubmissions?: boolean;
	teamCreationLocked?: boolean;
	results?: unknown[];
	submissionDescription?: string;
	allowGenderMixing?: boolean;
	showToEveryone?: boolean;
	hideInSignup?: boolean;
	teamCreationActuallyLocked?: boolean;
	lastUpdatedBy?: string;
	eventStatusCheckInEnabled?: boolean;
}
