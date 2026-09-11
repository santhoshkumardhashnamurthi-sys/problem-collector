import { z } from 'zod';

export const CATEGORIES = [
  'Education',
  'Technology',
  'Business',
  'Healthcare',
  'Finance',
  'Transport',
  'Daily Life',
  'Food',
  'Environment',
  'Government',
  'Other',
] as const;

export const WHO_FACES_THIS = [
  'Students',
  'Working Professionals',
  'Business Owners',
  'Parents',
  'Senior Citizens',
  'Children',
  'Everyone',
  'Other',
] as const;

export const FREQUENCIES = [
  'Daily',
  'Several times a week',
  'Weekly',
  'Monthly',
  'Occasionally',
  'Rarely',
] as const;

export const problemSubmissionSchema = z.object({
  raw_description: z
    .string()
    .min(10, 'Please provide at least 10 characters describing the problem')
    .max(2500, 'Description must be under 2500 characters'),
  category: z.string().min(1, 'Please select a category'),
  user_type: z.string().min(1, 'Please select who faces this problem'),
  frequency: z.string().min(1, 'Please select how often this happens'),
  location: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  pincode: z.string().optional(),
  is_anonymous: z.boolean().default(true),
  submitter_id: z.string().optional(),
});

export type ProblemSubmissionFormData = z.infer<typeof problemSubmissionSchema>;
