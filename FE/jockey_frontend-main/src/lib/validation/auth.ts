import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean().optional(),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Enter your name'),
    email: z.email('Enter a valid email address'),
    password: z.string().min(8, 'At least 8 characters'),
    agree: z.boolean().refine((value) => value, 'Please accept the Terms and Privacy Notice'),
  });

export type SignupValues = z.infer<typeof signupSchema>;
