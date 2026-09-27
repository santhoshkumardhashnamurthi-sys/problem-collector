import { z } from 'zod';

export const CATEGORIES = [
  'Education',
  'Technology',
  'Business',
  'Healthcare',
  'Transport',
  'Daily Life',
  'Other',
] as const;

export const WHO_FACES_THIS = [
  'Students',
  'Working Professionals',
  'Business Owners',
  'Parents',
  'Senior Citizens',
  'Everyone',
  'Other',
] as const;

export const FREQUENCIES = [
  'Daily',
  'Weekly',
  'Monthly',
  'Occasionally',
  'Rarely',
] as const;

export const problemSubmissionSchema = z.object({
  raw_description: z
    .string()
    .min(10, 'Please provide at least 10 characters describing the problem')
    .max(1000, 'Description must not exceed 1000 characters'),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),
  user_type: z.enum(WHO_FACES_THIS, {
    errorMap: () => ({ message: 'Please select who faces this problem' }),
  }),
  frequency: z.enum(FREQUENCIES, {
    errorMap: () => ({ message: 'Please select how often this happens' }),
  }),
  location: z.string().max(100, 'Location must not exceed 100 characters').optional().nullable(),
});

export type ProblemSubmissionFormData = z.infer<typeof problemSubmissionSchema>;

