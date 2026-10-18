import { loginSchema, signupSchema } from '@/lib/validation/auth';

const validSignup = {
  fullName: 'Isabella Santos',
  email: 'isabella@example.com',
  password: 'password1',
  agree: true,
};

describe('loginSchema', () => {
  it('accepts a valid email and non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false);
  });

  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('signupSchema', () => {
  it('accepts a valid payload', () => {
    expect(signupSchema.safeParse(validSignup).success).toBe(true);
  });

  it('requires the terms checkbox', () => {
    expect(signupSchema.safeParse({ ...validSignup, agree: false }).success).toBe(false);
  });

  it('requires an 8+ character password', () => {
    const short = 'short';
    expect(signupSchema.safeParse({ ...validSignup, password: short }).success).toBe(false);
  });
});
