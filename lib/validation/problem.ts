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

export const problemSubmissionSchema = z
  .object({
    raw_description: z.string().optional(),
    problem: z.string().optional(),
    category: z.string().min(1, 'Please select a category'),
    user_type: z.string().optional(),
    frequency: z.string().optional(),
    location: z.string().optional(),
    city: z.string().optional(),
    area: z.string().optional(),
    pincode: z.string().optional(),
    name: z.string().optional(),
    contact: z.string().optional(),
    is_anonymous: z.boolean().default(true),
    submitter_id: z.string().optional(),
  })
  .refine(
    (data) => {
      const desc = data.raw_description || data.problem;
      return typeof desc === 'string' && desc.trim().length >= 10;
    },
    {
      message: 'Please provide at least 10 characters describing the problem',
      path: ['raw_description'],
    }
  );

export type ProblemSubmissionFormData = z.infer<typeof problemSubmissionSchema>;
