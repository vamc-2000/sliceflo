// import { z } from 'zod';

// export const userSchema = z.object({
//   id: z.string().optional(),
//   email: z.string().email('Invalid email format'),
//   name: z.string().optional(),
//   provider: z.string().optional(),
//   isExistingUser: z.boolean().optional(),
//   profilePictureUrl: z.string().url().optional(),
// });

// export const providerSchema = z.enum(['local', 'google', 'microsoft']);

// // Updated loginRequestSchema to support passwordless login
// export const loginRequestSchema = z.object({
//   provider: providerSchema,
//   email: z.string().email('Invalid email format'),
//   idToken: z.string().optional(),
//   accessToken: z.string().optional(),
// }).refine((data) => {
//   if (data.provider === 'google' && !data.idToken) return false;
//   if (data.provider === 'microsoft' && !data.accessToken) return false;
//   return true;
// }, {
//   message: 'Required fields missing for the selected provider',
// });

// // export const registerRequestSchema = z.object({
// //   provider: providerSchema,
// //   email: z.string().email('Invalid email format'),
// //   // name: z.string().min(1, 'Name is required').optional(),
// //   name: z.string().optional(),

// //   idToken: z.string().optional(),
// //   accessToken: z.string().optional(),
// // });

// export const registerRequestSchema = z.object({
//   provider: providerSchema,
//   // email: z.string().email('Invalid email format'),
//   name: z.string().optional(),
//   idToken: z.string().optional(),
//   accessToken: z.string().optional(),
// }).refine((data) => {
//   // Require name only for local provider
//   if (data.provider === 'local' && !data.name) return false;
//   return true;
// }, {
//   message: 'Name is required for local signup.',
//   path: ['name']
// });


// export const authResponseSchema = z.object({
//   email: z.string().email(),
//   isExistingUser: z.boolean().optional(),
//   token: z.string(),
//   refreshToken: z.string().optional(),
//   user: z.object({
//     id: z.string(),
//     email: z.string().email(),
//     name: z.string().optional(),
//     provider: z.string().optional(),
//     isExistingUser: z.boolean().optional(),
//   }),
// });

// // Form schemas for components
// export const emailFormSchema = z.object({
//   email: z
//     .string()
//     .min(1, 'Email or user name required')
//     .email('Enter correct email or user name'),
// });

// export const loginFormSchema = z.object({
//   email: z.string().email('Please enter a valid email address'),
// });

// export const verifyOtpRequestSchema = z.object({
//   email: z.string().email('Invalid email format'),
//   otp: z.string().min(1, 'OTP is required').min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
// });

// // Type inference
// export type EmailFormData = z.infer<typeof emailFormSchema>;
// export type LoginFormData = z.infer<typeof loginFormSchema>;
// export type VerifyOtpData = z.infer<typeof verifyOtpRequestSchema>;




import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email('Invalid email format'),
  name: z.string().optional(),
  provider: z.string().optional(),
  isExistingUser: z.boolean().optional(),
  profilePictureUrl: z.string().url().optional(),
});

export const providerSchema = z.enum(['local', 'google', 'microsoft']);

// Updated loginRequestSchema to support passwordless login
export const loginRequestSchema = z.object({
  provider: providerSchema,
  email: z.string().email('Invalid email format'),
  idToken: z.string().optional(),
  accessToken: z.string().optional(),
}).refine((data) => {
  if (data.provider === 'google' && !data.idToken) return false;
  if (data.provider === 'microsoft' && !data.accessToken) return false;
  return true;
}, {
  message: 'Required fields missing for the selected provider',
});

export const registerRequestSchema = z.object({
  provider: providerSchema,
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').optional(),
  idToken: z.string().optional(),
  accessToken: z.string().optional(),
});

// export const authResponseSchema = z.object({
//   email: z.string().email(),
//   isExistingUser: z.boolean().optional(),
//   token: z.string(),
//   refreshToken: z.string().optional(),
//   user: z.object({
//     id: z.string(),
//     email: z.string().email(),
//     name: z.string().optional(),
//     provider: z.string().optional(),
//     isExistingUser: z.boolean().optional(),
//   }),
// });

// Form schemas for components
export const emailFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email or user name required')
    .email('Enter correct email or user name'),
});

export const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const verifyOtpRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().min(1, 'OTP is required').min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

// Type inference
export type EmailFormData = z.infer<typeof emailFormSchema>;
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type VerifyOtpData = z.infer<typeof verifyOtpRequestSchema>;