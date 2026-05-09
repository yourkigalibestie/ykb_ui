import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { BackendAuthError } from '../../utils/backendAuth';
import { API_BASE, getBackendAuthHeaders } from '../../utils/backendAuth';
import { fetchAdminRequests, type BackendAdminRequest, type BackendRequestStatus, updateAdminRequest, fetchProvidersForService, assignProviderToRequest } from '../../utils/backendAdmin';
import type { BackendProviderProfile } from '../../utils/backendProviders';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatBudget(value: BackendAdminRequest['budget']): string {
  if (value == null) return 'N/A';
  if (typeof value === 'number' && Number.isFinite(value)) return value.toLocaleString();
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return 'N/A';
}

function deriveRequestTitle(request: BackendAdminRequest): string {
  const description = request.description ?? '';
  const match = description.match(/^Service:\s*(.+)$/m);
  const service = match?.[1]?.trim();
  return service && service.length > 0 ? service : 'Service request';
}

export function AdminRequests() {
  const [requests, setRequests] = useState<BackendAdminRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // Assignment modal state
  const [assigningRequestId, setAssigningRequestId] = useState<string | null>(null);
  const [providers, setProviders] = useState<BackendProviderProfile[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [providerSearchTerm, setProviderSearchTerm] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);

  const requestById = useMemo(() => {
    const map = new Map<string, BackendAdminRequest>();
    requests.forEach((r) => map.set(r.id, r));
    return map;
  }, [requests]);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await fetchAdminRequests();
      setRequests(next);
    } catch (err) {
      const status = err instanceof BackendAuthError ? err.status : undefined;
      if (status === 401) {
        setError('Please login as an admin to view requests.');
      } else if (status === 403) {
        setError('Admin access required.');
      } else if (status === 0 && err instanceof BackendAuthError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Could not load requests.');
      }
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markReceived = useCallback(
    async (requestId: string) => {
      const existing = requestById.get(requestId);
      if (!existing) return;
      if (existing.status === 'IN_REVIEW') return;

      setUpdatingId(requestId);
      setActionError(null);

      const nextStatus: BackendRequestStatus = 'IN_REVIEW';
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: nextStatus } : r)));

      try {
        const updated = await updateAdminRequest(requestId, { status: nextStatus });
        setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
      } catch (err) {
        setRequests((prev) => prev.map((r) => (r.id === requestId ? existing : r)));
        const status = err instanceof BackendAuthError ? err.status : undefined;
        if (status === 401) setActionError('Please login again to update this request.');
        else if (status === 403) setActionError('Admin access required.');
        else if (status === 0 && err instanceof BackendAuthError) setActionError(err.message);
        else setActionError(err instanceof Error ? err.message : 'Could not update request.');
      } finally {
        setUpdatingId(null);
      }
    },
    [requestById]
  );

  const markResolved = useCallback(
    async (requestId: string) => {
      const existing = requestById.get(requestId);
      if (!existing) return;
      if (existing.status === 'RESOLVED') return;

      setUpdatingId(requestId);
      setActionError(null);

      const nextStatus: BackendRequestStatus = 'RESOLVED';
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: nextStatus } : r)));

      try {
        const updated = await updateAdminRequest(requestId, { status: nextStatus });
        setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
      } catch (err) {
        setRequests((prev) => prev.map((r) => (r.id === requestId ? existing : r)));
        const status = err instanceof BackendAuthError ? err.status : undefined;
        if (status === 401) setActionError('Please login again to update this request.');
        else if (status === 403) setActionError('Admin access required.');
        else if (status === 0 && err instanceof BackendAuthError) setActionError(err.message);
        else setActionError(err instanceof Error ? err.message : 'Could not update request.');
      } finally {
        setUpdatingId(null);
      }
    },
    [requestById]
  );

  const openAssignModal = useCallback(
    async (requestId: string) => {
      const request = requestById.get(requestId);
      if (!request) return;

      setAssigningRequestId(requestId);
      setProviderSearchTerm('');
      setAssignError(null);
      setIsLoadingProviders(true);

      try {
        const serviceName = deriveRequestTitle(request);
        const providerList = await fetchProvidersForService(serviceName);
        setProviders(providerList);
      } catch (err) {
        const status = err instanceof BackendAuthError ? err.status : undefined;
        if (status === 401) setAssignError('Please login again.');
        else if (status === 0 && err instanceof BackendAuthError) setAssignError(err.message);
        else setAssignError(err instanceof Error ? err.message : 'Could not load providers.');
        setProviders([]);
      } finally {
        setIsLoadingProviders(false);
      }
    },
    [requestById]
  );

  const assignProvider = useCallback(
    async (requestId: string, providerId: string) => {
      setUpdatingId(requestId);
      setAssignError(null);

      try {
        const updated = await assignProviderToRequest(requestId, providerId);
        setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
        setAssigningRequestId(null);
      } catch (err) {
        const status = err instanceof BackendAuthError ? err.status : undefined;
        if (status === 401) setAssignError('Please login again.');
        else if (status === 403) setAssignError('Admin access required.');
        else if (status === 0 && err instanceof BackendAuthError) setAssignError(err.message);
        else setAssignError(err instanceof Error ? err.message : 'Could not assign provider.');
      } finally {
        setUpdatingId(null);
      }
    },
    []
  );

  const confirmResolution = useCallback(
    async (requestId: string) => {
      const existing = requestById.get(requestId);
      if (!existing) return;

      setUpdatingId(requestId);
      setActionError(null);

      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: 'RESOLVED' as BackendRequestStatus } : r
        )
      );

      try {
        const res = await fetch(`${API_BASE}/admin/requests/${encodeURIComponent(requestId)}/confirm-resolution`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getBackendAuthHeaders(),
          },
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(error || `Request failed (${res.status})`);
        }

        const json = (await res.json()) as { request?: BackendAdminRequest };
        if (json?.request?.id) {
          setRequests((prev) => prev.map((r) => (r.id === requestId ? json.request! : r)));
        }
      } catch (err) {
        setRequests((prev) => prev.map((r) => (r.id === requestId ? existing : r)));
        const status = err instanceof BackendAuthError ? err.status : undefined;
        if (status === 401) setActionError('Please login again.');
        else if (status === 0 && err instanceof BackendAuthError) setActionError(err.message);
        else setActionError(err instanceof Error ? err.message : 'Could not confirm resolution.');
      } finally {
        setUpdatingId(null);
      }
    },
    [requestById]
  );

  const filteredProviders = useMemo(() => {
    if (!providerSearchTerm.trim()) return providers;
    const lower = providerSearchTerm.toLowerCase();
    return providers.filter(
      (p) =>
        p.user?.name.toLowerCase().includes(lower) ||
        p.user?.email.toLowerCase().includes(lower) ||
        p.user?.phone?.includes(providerSearchTerm) ||
        p.businessName?.toLowerCase().includes(lower)
    );
  }, [providers, providerSearchTerm]);

  useEffect(() => {
    void loadRequests();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void loadRequests();
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [loadRequests]);

  return (
    <main className="pt-16">

      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Manage client requests</p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Requests</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
              See client requests submitted through the app (stored locally for now).
            </p>
          </div>
        </div>
      </section>

      <section className="ykb-section bg-dark-light">
        <div className="ykb-container">
          {error ? (
            <div className="ykb-card p-6 text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">Could not load requests</h2>
              <p className="text-textSecondary">{error}</p>
            </div>
          ) : (
            <>
              {actionError ? <div className="ykb-alert ykb-alert-error mb-4">{actionError}</div> : null}

              {isLoading ? (
                <div className="ykb-card p-6 text-center">
                  <h2 className="text-2xl font-bold text-primary mb-2">Loading…</h2>
                  <p className="text-textSecondary">Fetching requests from the backend.</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="ykb-card p-6 text-center">
                  <h2 className="text-2xl font-bold text-primary mb-2">No requests yet</h2>
                  <p className="text-textSecondary">Submit one from the client side at /request.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {requests.map((r) => (
                    <div key={r.id} className="ykb-card">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-primary">{deriveRequestTitle(r)}</h2>
                          <p className="text-textSecondary text-sm">{formatDate(r.createdAt)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs text-textSecondary">{r.id}</span>
                          <div className="flex flex-col gap-1 items-end">
                            {r.status === 'PENDING' ? (
                              <button
                                type="button"
                                onClick={() => void markReceived(r.id)}
                                disabled={updatingId === r.id}
                                className="ykb-button-solid px-3 py-1.5 text-xs disabled:opacity-70"
                              >
                                {updatingId === r.id ? 'Updating…' : 'Mark received'}
                              </button>
                            ) : r.status === 'IN_REVIEW' && r.providerResolvedAt ? (
                              <button
                                type="button"
                                onClick={() => void confirmResolution(r.id)}
                                disabled={updatingId === r.id}
                                className="ykb-button-solid px-3 py-1.5 text-xs disabled:opacity-70 bg-success"
                              >
                                {updatingId === r.id ? 'Confirming…' : 'Confirm Resolution'}
                              </button>
                            ) : r.status === 'IN_REVIEW' ? (
                              <button
                                type="button"
                                onClick={() => void markResolved(r.id)}
                                disabled={updatingId === r.id}
                                className="ykb-button-solid px-3 py-1.5 text-xs disabled:opacity-70"
                              >
                                {updatingId === r.id ? 'Updating…' : 'Mark resolved'}
                              </button>
                            ) : null}
                            {r.status !== 'CANCELLED' && !r.provider && (
                              <button
                                type="button"
                                onClick={() => void openAssignModal(r.id)}
                                disabled={updatingId === r.id}
                                className="ykb-button-secondary px-3 py-1.5 text-xs disabled:opacity-70"
                              >
                                {updatingId === r.id ? 'Assigning…' : 'Assign Provider'}
                              </button>
                            )}
                            {r.providerResolvedAt && r.status === 'IN_REVIEW' && (
                              <div className="text-xs bg-warning/10 text-warning px-2 py-1 rounded">
                                Provider marked resolved
                              </div>
                            )}
                            {r.provider && (
                              <div className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                                Assigned: {r.provider.user?.name || 'Provider'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <div className="text-textSecondary">
                          <span className="font-semibold text-primary">Client:</span> {r.user?.name || r.user?.email || 'N/A'}
                        </div>
                        <div className="text-textSecondary">
                          <span className="font-semibold text-primary">Phone:</span> {r.user?.phone || 'N/A'}
                        </div>
                        <div className="text-textSecondary">
                          <span className="font-semibold text-primary">Status:</span> {r.status}
                        </div>
                        <div className="text-textSecondary">
                          <span className="font-semibold text-primary">Location:</span> {r.location}
                        </div>
                        <div className="text-textSecondary">
                          <span className="font-semibold text-primary">Preferred date:</span>{' '}
                          {r.preferredDate ? formatDate(r.preferredDate) : 'N/A'}
                        </div>
                        <div className="text-textSecondary">
                          <span className="font-semibold text-primary">Budget:</span> {formatBudget(r.budget)}
                        </div>
                        <div className="text-textSecondary">
                          <span className="font-semibold text-primary">Description:</span> {r.description}
                        </div>
                        {r.customerNotes ? (
                          <div className="text-textSecondary whitespace-pre-wrap">
                            <span className="font-semibold text-primary">Customer notes:</span> {r.customerNotes}
                          </div>
                        ) : null}
                        {r.adminNotes ? (
                          <div className="text-textSecondary">
                            <span className="font-semibold text-primary">Admin notes:</span> {r.adminNotes}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Assignment Modal */}
      {assigningRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border p-6">
              <h2 className="text-xl font-bold text-primary">Assign Service Provider</h2>
              <button
                type="button"
                onClick={() => setAssigningRequestId(null)}
                className="text-textSecondary hover:text-primary"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {assignError ? (
                <div className="ykb-alert ykb-alert-error mb-4">{assignError}</div>
              ) : null}

              {/* Search Field */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-primary mb-2">Search Providers</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-3 text-textSecondary" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or business..."
                    value={providerSearchTerm}
                    onChange={(e) => setProviderSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Providers List */}
              {isLoadingProviders ? (
                <div className="text-center py-8">
                  <p className="text-textSecondary">Loading providers...</p>
                </div>
              ) : filteredProviders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-textSecondary">
                    {providers.length === 0 ? 'No approved providers available for this service.' : 'No providers match your search.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProviders.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => void assignProvider(assigningRequestId, provider.id)}
                      disabled={updatingId === assigningRequestId}
                      className="w-full text-left p-4 border border-border rounded-lg hover:bg-surface/50 disabled:opacity-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-primary">{provider.user?.name || 'Unknown'}</p>
                          <p className="text-sm text-textSecondary">{provider.user?.email}</p>
                          {provider.user?.phone && (
                            <p className="text-sm text-textSecondary">{provider.user.phone}</p>
                          )}
                          {provider.businessName && (
                            <p className="text-sm text-textSecondary mt-1">{provider.businessName}</p>
                          )}
                        </div>
                        {updatingId === assigningRequestId && (
                          <span className="text-xs text-primary">Assigning...</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border p-6">
              <button
                type="button"
                onClick={() => setAssigningRequestId(null)}
                className="w-full ykb-button-outline py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
