import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

export const intakeFormSchema = z.object({
	firstName: z.string().min(1),
	preferredFirstName: z.string().optional(),
	lastName: z.string().min(1),
	grade: z.enum(['9', '10', '11', '12']),
	studentId: z.number().int().positive().gte(1000000).lte(9999999),
	gender: z.enum(['Male', 'Female', 'Opt-Out', 'Non-Disclosed']),
	demographic: z.enum([
		'American Indian/Alaskan Native',
		'Black / African-American',
		'Asian/Asian-American/Pacific Islander',
		'Hispanic/Latino',
		'Mixed Race',
		'White/Caucasian',
		'Opt-Out',
		'Non-Disclosed',
	]),
	tShirtSize: z.enum([
		'W XS',
		'W S',
		'W M',
		'W L',
		'W XL',
		'W XXL',
		'M XS',
		'M S',
		'M M',
		'M L',
		'M XL',
		'M XXL',
	]),
});

export const dataForm = await superValidate(zod(intakeFormSchema));

export type IntakeFormSchema = typeof intakeFormSchema;
