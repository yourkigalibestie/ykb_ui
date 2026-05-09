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

function requireBackendSession() {
  const session = getBackendSession();
  if (!session?.accessToken) throw new BackendAuthError('Not authenticated.', 401);
  return session;
}

export type BackendRequest = {
  id: string;
  description: string;
  location: string;
  preferredDate?: string | null;
  budget?: string | number | null;
  status: string;
  adminNotes?: string | null;
  customerNotes?: string | null;
  customerResolvedAt?: string | null;
  providerResolvedAt?: string | null;
  adminResolvedAt?: string | null;
  adminConfirmedAt?: string | null;
  requiresAdminConfirmation?: boolean;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type BackendRequestStatus = 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'CANCELLED';

export type CreateBackendRequestInput = {
  description: string;
  location: string;
  preferredDate?: string | null;
  budget?: string | null;
};

export async function createBackendRequest(input: CreateBackendRequestInput): Promise<BackendRequest> {
  requireBackendSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getBackendAuthHeaders(),
      },
      body: JSON.stringify({
        description: input.description,
        location: input.location,
        preferredDate: input.preferredDate ?? null,
        budget: input.budget ?? null,
      }),
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await readApiErrorMessage(res), res.status);
  }

  const json = (await res.json()) as { request?: BackendRequest };
  if (!json?.request?.id) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.request;
}

export async function fetchMyBackendRequests(): Promise<BackendRequest[]> {
  requireBackendSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/requests/me`, {
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

  const json = (await res.json()) as { requests?: BackendRequest[] };
  if (!Array.isArray(json?.requests)) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.requests;
}

export async function updateMyBackendRequest(
  requestId: string,
  input: { description?: string; location?: string; preferredDate?: string | null; budget?: string | null }
): Promise<BackendRequest> {
  requireBackendSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/requests/${encodeURIComponent(requestId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getBackendAuthHeaders(),
      },
      body: JSON.stringify({
        ...(typeof input.description === 'string' ? { description: input.description } : null),
        ...(typeof input.location === 'string' ? { location: input.location } : null),
        ...(input.preferredDate !== undefined ? { preferredDate: input.preferredDate ?? null } : null),
        ...(input.budget !== undefined ? { budget: input.budget ?? null } : null),
      }),
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await readApiErrorMessage(res), res.status);
  }

  const json = (await res.json()) as { request?: BackendRequest };
  if (!json?.request?.id) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.request;
}

export async function addMyBackendRequestNote(requestId: string, note: string): Promise<BackendRequest> {
  requireBackendSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/requests/${encodeURIComponent(requestId)}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getBackendAuthHeaders(),
      },
      body: JSON.stringify({ note }),
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await readApiErrorMessage(res), res.status);
  }

  const json = (await res.json()) as { request?: BackendRequest };
  if (!json?.request?.id) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.request;
}

export async function rateBackendRequest(requestId: string, rating: number): Promise<BackendRequest> {
  requireBackendSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/requests/${encodeURIComponent(requestId)}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getBackendAuthHeaders(),
      },
      body: JSON.stringify({ rating }),
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await readApiErrorMessage(res), res.status);
  }

  const json = (await res.json()) as { request?: BackendRequest };
  if (!json?.request?.id) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.request;
}
