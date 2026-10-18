import { SessionOptions } from 'iron-session';

export interface SessionData {
  id: string;
  name: string;
  email: string;
  role: string;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  id: '',
  name: '',
  email: '',
  role: '',
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  },
};

// Fail fast if no secret in production
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET environment variable is required in production');
}

// Fallback for dev only
if (!process.env.SESSION_SECRET) {
  (sessionOptions as any).password = 'complex_password_at_least_32_characters_long_for_dev';
}
