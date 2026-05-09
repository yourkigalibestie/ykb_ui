import { readJson, writeJson } from './storage';

export type BackendRole = 'ADMIN' | 'CUSTOMER' | 'PROVIDER' | (string & {});

export type BackendUser = {
  id: string;
  email: string;
  name: string;
  role: BackendRole;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BackendAuthResult = {
  user: BackendUser;
  accessToken: string;
};

export type BackendMeResult = {
  user: BackendUser;
};

export type BackendSession = BackendAuthResult & {
  createdAt: string;
};

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

const SESSION_KEY = 'backendSession';

export class BackendAuthError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'BackendAuthError';
    this.status = status;
    this.details = details;
  }
}

type ApiErrorResponse = {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
};

function firstString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstString(item);
      if (found) return found;
    }
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const found = firstString(item);
      if (found) return found;
    }
  }
  return null;
}

async function readApiError(res: Response): Promise<{ message: string; details?: unknown }> {
  try {
    const data = (await res.json()) as ApiErrorResponse;
    const msg = data.error?.message;
    const message = typeof msg === 'string' && msg.trim().length > 0 ? msg : null;
    const details = data.error?.details;

    if (message === 'Validation failed' && details) {
      const extracted = firstString(details);
      if (extracted) return { message: extracted, details };
    }

    if (message) return { message, details };
  } catch {
    // ignore
  }
  return { message: `Request failed (${res.status})` };
}

export function getBackendSession(): BackendSession | null {
  return readJson<BackendSession | null>(SESSION_KEY, null);
}

export function setBackendSession(session: BackendSession | null): void {
  writeJson<BackendSession | null>(SESSION_KEY, session);
}

export function logoutBackend(): void {
  setBackendSession(null);
}

export function getBackendAccessToken(): string | null {
  return getBackendSession()?.accessToken ?? null;
}

export function isBackendAdmin(): boolean {
  const session = getBackendSession();
  return session?.user?.role === 'ADMIN';
}

export function getBackendAuthHeaders(): Record<string, string> {
  const token = getBackendAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchBackendMe(): Promise<BackendUser> {
  const session = getBackendSession();
  if (!session?.accessToken) {
    throw new BackendAuthError('Not authenticated.', 401);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        ...getBackendAuthHeaders(),
      },
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    const apiError = await readApiError(res);
    throw new BackendAuthError(apiError.message, res.status, apiError.details);
  }

  const json = (await res.json()) as BackendMeResult;
  if (!json?.user?.id) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.user;
}

export async function loginBackend(emailRaw: string, passwordRaw: string): Promise<BackendSession> {
  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw;

  if (!email || !password) {
    throw new BackendAuthError('Email and password are required.');
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    const apiError = await readApiError(res);
    throw new BackendAuthError(apiError.message, res.status, apiError.details);
  }

  const json = (await res.json()) as BackendAuthResult;
  if (!json?.user || !json?.accessToken) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  const session: BackendSession = { ...json, createdAt: new Date().toISOString() };
  setBackendSession(session);
  return session;
}

export type RegisterBackendInput = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: Exclude<BackendRole, 'ADMIN'>;

  // Provider-only fields
  businessName?: string;
  service?: string;
  location?: string;
  moneyRange?: string;
  services?: Array<{ name: string; price: string; description?: string }>;
};

export async function registerBackend(input: RegisterBackendInput): Promise<BackendSession> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const name = input.name.trim();
  const phone = input.phone?.trim() || undefined;
  const role = input.role;
  const businessName = input.businessName?.trim() || undefined;
  const service = input.service?.trim() || undefined;
  const location = input.location?.trim() || undefined;
  const moneyRange = input.moneyRange?.trim() || undefined;
  const services = input.services;

  if (!email) throw new BackendAuthError('Email is required.');
  if (!name) throw new BackendAuthError('Name is required.');
  if (!password) throw new BackendAuthError('Password is required.');

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name,
        phone,
        role,
        businessName,
        service,
        location,
        moneyRange,
        services,
      }),
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    const apiError = await readApiError(res);
    throw new BackendAuthError(apiError.message, res.status, apiError.details);
  }

  const json = (await res.json()) as BackendAuthResult;
  if (!json?.user || !json?.accessToken) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  const session: BackendSession = { ...json, createdAt: new Date().toISOString() };
  setBackendSession(session);
  return session;
}
