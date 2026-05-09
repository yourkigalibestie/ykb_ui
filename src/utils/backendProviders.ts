import { API_BASE, BackendAuthError, getBackendAuthHeaders, getBackendSession } from './backendAuth';

type ApiErrorResponse = {
  error?: {
    message?: unknown;
  };
};

async function readApiErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiErrorResponse;
    const msg = data.error?.message;
    if (typeof msg === 'string' && msg.trim().length > 0) return msg;
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`;
}

export type ProviderServiceOffering = {
  name: string;
  price: string;
  description?: string;
};

export type BackendProviderProfile = {
  id: string;
  userId: string;
  status: string;
  businessName?: string | null;
  mainService?: string | null;
  location?: string | null;
  moneyRange?: string | null;
  serviceOfferings?: ProviderServiceOffering[] | null;
  bio?: string | null;
  rejectionReason?: string | null;
  profileImageUrl?: string | null;
  profileImagePublicId?: string | null;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string | null;
  };
};

export async function fetchProviderMeProfile(): Promise<BackendProviderProfile> {
  const session = getBackendSession();
  if (!session?.accessToken) {
    throw new BackendAuthError('Not authenticated.', 401);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/providers/me/profile`, {
      method: 'GET',
      headers: {
        ...getBackendAuthHeaders(),
      },
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await readApiErrorMessage(res), res.status);
  }

  const json = (await res.json()) as { provider?: BackendProviderProfile };
  if (!json?.provider?.id) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.provider;
}

export type UpdateProviderMeBody = {
  bio?: string | null;
  profileImageUrl?: string | null;
  profileImagePublicId?: string | null;
  businessName?: string | null;
  mainService?: string | null;
  location?: string | null;
  moneyRange?: string | null;
  serviceOfferings?: ProviderServiceOffering[] | null;
};

export async function updateProviderMeProfile(body: UpdateProviderMeBody): Promise<BackendProviderProfile> {
  const session = getBackendSession();
  if (!session?.accessToken) {
    throw new BackendAuthError('Not authenticated.', 401);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/providers/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getBackendAuthHeaders(),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await readApiErrorMessage(res), res.status);
  }

  const json = (await res.json()) as { provider?: BackendProviderProfile };
  if (!json?.provider?.id) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.provider;
}
