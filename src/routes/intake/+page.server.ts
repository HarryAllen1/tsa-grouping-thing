import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions } from './$types.js';
import { intakeFormSchema } from './intake-form-schema.js';

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(intakeFormSchema));

		if (!form.valid) {
			return fail(400, {
				form,
			});
		}
		return {
			form,
		};
	},
};
