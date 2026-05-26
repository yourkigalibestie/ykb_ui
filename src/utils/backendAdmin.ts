import { API_BASE, BackendAuthError, getBackendAuthHeaders, getBackendSession } from './backendAuth';
import { getFriendlyRequestError, getFriendlyResponseError } from './friendlyErrors';
import type { BackendProviderProfile } from './backendProviders';

function requireAdminSession() {
  const session = getBackendSession();
  if (!session?.accessToken) throw new BackendAuthError('Not authenticated.', 401);
  if (session.user.role !== 'ADMIN') throw new BackendAuthError('Admin access required.', 403);
  return session;
}

export async function fetchAdminProviders(): Promise<BackendProviderProfile[]> {
  requireAdminSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/admin/providers`, {
      method: 'GET',
      headers: {
        ...getBackendAuthHeaders(),
      },
    });
  } catch (err) {
    throw new BackendAuthError(getFriendlyRequestError({ error: err, action: 'load admin providers' }), 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await getFriendlyResponseError(res, 'load admin providers'), res.status);
  }

  const json = (await res.json()) as { providers?: BackendProviderProfile[] };
  if (!Array.isArray(json?.providers)) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.providers;
}

export async function fetchAdminProviderById(providerId: string): Promise<BackendProviderProfile> {
  requireAdminSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/admin/providers/${encodeURIComponent(providerId)}`, {
      method: 'GET',
      headers: {
        ...getBackendAuthHeaders(),
      },
    });
  } catch (err) {
    throw new BackendAuthError(getFriendlyRequestError({ error: err, action: 'load the provider' }), 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await getFriendlyResponseError(res, 'load the provider'), res.status);
  }

  const json = (await res.json()) as { provider?: BackendProviderProfile };
  if (!json?.provider?.id) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.provider;
}

export type BackendAdminRequest = {
  id: string;
  description: string;
  location: string;
  preferredDate?: string | null;
  budget?: string | number | null;
  status: string;
  adminNotes?: string | null;
  customerNotes?: string | null;
  providerResolvedAt?: string | null;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  provider?: {
    id: string;
    user?: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
    };
  } | null;
};

export type BackendRequestStatus = 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'CANCELLED';

export async function fetchAdminRequests(): Promise<BackendAdminRequest[]> {
  requireAdminSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/admin/requests`, {
      method: 'GET',
      headers: {
        ...getBackendAuthHeaders(),
      },
    });
  } catch (err) {
    throw new BackendAuthError(getFriendlyRequestError({ error: err, action: 'load admin requests' }), 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await getFriendlyResponseError(res, 'load admin requests'), res.status);
  }

  const json = (await res.json()) as { requests?: BackendAdminRequest[] };
  if (!Array.isArray(json?.requests)) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.requests;
}

export async function updateAdminRequest(
  requestId: string,
  input: { status: BackendRequestStatus; adminNotes?: string | null }
): Promise<BackendAdminRequest> {
  requireAdminSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/admin/requests/${encodeURIComponent(requestId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getBackendAuthHeaders(),
      },
      body: JSON.stringify({
        status: input.status,
        adminNotes: input.adminNotes ?? null,
      }),
    });
  } catch (err) {
    throw new BackendAuthError(getFriendlyRequestError({ error: err, action: 'update the request' }), 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await getFriendlyResponseError(res, 'update the request'), res.status);
  }

  const json = (await res.json()) as { request?: BackendAdminRequest };
  if (!json?.request?.id) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.request;
}

export type BackendAdminBooking = {
  id: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  paymentId?: string | null;
  status: string;
  scheduledDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  provider: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
    };
  };
  service: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
  payment?: {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
  } | null;
};

export async function fetchAdminBookings(): Promise<BackendAdminBooking[]> {
  requireAdminSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/admin/bookings`, {
      method: 'GET',
      headers: {
        ...getBackendAuthHeaders(),
      },
    });
  } catch (err) {
    throw new BackendAuthError(getFriendlyRequestError({ error: err, action: 'load admin bookings' }), 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await getFriendlyResponseError(res, 'load admin bookings'), res.status);
  }

  const json = (await res.json()) as { bookings?: BackendAdminBooking[] };
  if (!Array.isArray(json?.bookings)) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.bookings;
}

export type BackendAdminPayment = {
  id: string;
  bookingId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionId?: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    customer: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
    };
    provider: {
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
        phone?: string | null;
      };
    };
    service: {
      id: string;
      name: string;
    };
  };
};

export async function fetchAdminPayments(): Promise<BackendAdminPayment[]> {
  requireAdminSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/admin/payments`, {
      method: 'GET',
      headers: {
        ...getBackendAuthHeaders(),
      },
    });
  } catch (err) {
    throw new BackendAuthError(getFriendlyRequestError({ error: err, action: 'load admin payments' }), 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await getFriendlyResponseError(res, 'load admin payments'), res.status);
  }

  const json = (await res.json()) as { payments?: BackendAdminPayment[] };
  if (!Array.isArray(json?.payments)) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.payments;
}

export type ProviderStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export async function verifyProvider(
  providerId: string,
  status: 'APPROVED' | 'REJECTED',
  rejectionReason?: string | null
): Promise<BackendProviderProfile> {
  requireAdminSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/admin/providers/${encodeURIComponent(providerId)}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getBackendAuthHeaders(),
      },
      body: JSON.stringify({ status, rejectionReason: status === 'REJECTED' ? rejectionReason ?? null : null }),
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await getFriendlyResponseError(res, 'verify the provider'), res.status);
  }

  const json = (await res.json()) as { provider?: BackendProviderProfile };
  if (!json?.provider?.id) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.provider;
}

export type BackendAdminUser = {
  id: string;
  email: string;
  phone?: string | null;
  name: string;
  role: 'ADMIN' | 'PROVIDER' | 'CUSTOMER';
  provider?: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  } | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchAdminUsers(role?: string): Promise<BackendAdminUser[]> {
  requireAdminSession();

  const url = new URL(`${API_BASE}/admin/users`);
  if (role) {
    url.searchParams.set('role', role);
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        ...getBackendAuthHeaders(),
      },
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await getFriendlyResponseError(res, 'load admin users'), res.status);
  }

  const json = (await res.json()) as { users?: BackendAdminUser[] };
  if (!Array.isArray(json?.users)) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.users;
}

export async function fetchProvidersForService(serviceName: string): Promise<BackendProviderProfile[]> {
  requireAdminSession();

  const url = new URL(`${API_BASE}/admin/requests/undefined/providers`);
  url.searchParams.set('service', serviceName);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        ...getBackendAuthHeaders(),
      },
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await getFriendlyResponseError(res, 'load providers for this service'), res.status);
  }

  const json = (await res.json()) as { providers?: BackendProviderProfile[] };
  if (!Array.isArray(json?.providers)) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.providers;
}

export async function assignProviderToRequest(
  requestId: string,
  providerId: string
): Promise<BackendAdminRequest> {
  requireAdminSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/admin/requests/${encodeURIComponent(requestId)}/assign-provider`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getBackendAuthHeaders(),
      },
      body: JSON.stringify({ providerId }),
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await getFriendlyResponseError(res, 'assign the provider to the request'), res.status);
  }

  const json = (await res.json()) as { request?: BackendAdminRequest };
  if (!json?.request?.id) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.request;
}

export async function confirmRequestResolution(requestId: string): Promise<BackendAdminRequest> {
  requireAdminSession();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/admin/requests/${encodeURIComponent(requestId)}/confirm-resolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getBackendAuthHeaders(),
      },
    });
  } catch {
    throw new BackendAuthError('Could not reach the backend. Is it running?', 0);
  }

  if (!res.ok) {
    throw new BackendAuthError(await getFriendlyResponseError(res, 'confirm the request resolution'), res.status);
  }

  const json = (await res.json()) as { request?: BackendAdminRequest };
  if (!json?.request?.id) {
    throw new BackendAuthError('Invalid response from backend.');
  }

  return json.request;
}
