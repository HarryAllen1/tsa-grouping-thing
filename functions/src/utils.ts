import { UserDoc } from './types';

export const userToName = (user: UserDoc): string =>
	user.preferredFirstName
		? `${user.preferredFirstName} (${user.firstName}) ${user.lastName}`
		: `${user.firstName} ${user.lastName}`;
