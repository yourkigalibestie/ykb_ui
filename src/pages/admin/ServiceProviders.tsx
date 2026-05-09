import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BackendAuthError } from '../../utils/backendAuth';
import { fetchAdminProviders, verifyProvider } from '../../utils/backendAdmin';
import type { BackendProviderProfile } from '../../utils/backendProviders';

export function AdminServiceProviders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState<BackendProviderProfile[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const serviceFilter = searchParams.get('service');
  const normalizedServiceFilter = (serviceFilter ?? '').trim().toLowerCase();

  const filteredProviders = normalizedServiceFilter
    ? providers.filter((provider) => {
        const mainService = (provider.mainService ?? '').trim().toLowerCase();
        if (mainService && (mainService === normalizedServiceFilter || mainService.includes(normalizedServiceFilter))) {
          return true;
        }

        const offerings = provider.serviceOfferings;
        if (Array.isArray(offerings)) {
          return offerings.some((o) => {
            const name = (o?.name ?? '').trim().toLowerCase();
            return name === normalizedServiceFilter || name.includes(normalizedServiceFilter);
          });
        }

        return false;
      })
    : providers;

  const pendingProviders = providers.filter(p => p.status === 'PENDING');

  const handleVerifyProvider = async (
    providerId: string,
    action: 'APPROVED' | 'REJECTED',
    rejectionReason?: string | null
  ) => {
    setVerifyingId(providerId);
    setActionError(null);

    if (action === 'REJECTED' && !(rejectionReason?.trim())) {
      setActionError('Please provide a reason for rejecting this provider.');
      setVerifyingId(null);
      return;
    }

    try {
      await verifyProvider(providerId, action, rejectionReason?.trim() ?? null);
      // Refresh the providers list
      const result = await fetchAdminProviders();
      setProviders(result);
      setRejectingId(null);
      setRejectionReasons((current) => ({ ...current, [providerId]: '' }));
    } catch (err) {
      const message = err instanceof BackendAuthError ? err.message : 'Could not update provider status.';
      setActionError(message);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleStartReject = (providerId: string) => {
    setActionError(null);
    setRejectingId(providerId);
  };

  const handleCancelReject = () => {
    setActionError(null);
    setRejectingId(null);
  };

  const handleRejectionReasonChange = (providerId: string, value: string) => {
    setRejectionReasons((current) => ({ ...current, [providerId]: value }));
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setStatus('loading');
      setError(null);

      try {
        const result = await fetchAdminProviders();
        if (!mounted) return;
        setProviders(result);
        setStatus('ready');
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof BackendAuthError ? err.message : 'Could not load service providers.';
        setError(message);
        setStatus('error');
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="pt-16">

      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Manage service providers</p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Service Providers</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
              View the available service providers registered under different services.
            </p>
          </div>
        </div>
      </section>

      <section className="ykb-section bg-dark-light">
        <div className="ykb-container">
          {serviceFilter ? (
            <div className="mb-4 ykb-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">Filtered by service</div>
                <div className="mt-1 text-lg font-semibold text-primary">{serviceFilter}</div>
                <div className="mt-1 text-sm text-textSecondary">Showing {filteredProviders.length} provider(s).</div>
              </div>
              <button
                type="button"
                className="ykb-button-outline"
                onClick={() => setSearchParams({})}
              >
                Clear filter
              </button>
            </div>
          ) : null}

          {/* Pending Providers Section */}
          {pendingProviders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">Pending Approvals ({pendingProviders.length})</h2>
              <div className="space-y-4">
                {pendingProviders.map((provider) => (
                  <div key={provider.id} className="bg-white rounded-lg border border-border p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-primary mb-1">
                          {provider.businessName ?? provider.user?.name ?? 'Service Provider'}
                        </h3>
                        <p className="text-sm text-primary font-medium mb-2">{provider.mainService ?? '—'}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-textSecondary">
                          <div><span className="font-semibold text-primary">Location:</span> {provider.location ?? '—'}</div>
                          <div><span className="font-semibold text-primary">Email:</span> {provider.user?.email ?? '—'}</div>
                          {provider.user?.phone && (
                            <div><span className="font-semibold text-primary">Phone:</span> {provider.user.phone}</div>
                          )}
                          <div><span className="font-semibold text-primary">Services:</span> {Array.isArray(provider.serviceOfferings) ? provider.serviceOfferings.length : 0}</div>
                        </div>
                        {provider.bio && (
                          <div className="mt-3 text-sm text-textSecondary">
                            <span className="font-semibold text-primary">Bio:</span> {provider.bio}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <button
                          type="button"
                          onClick={() => handleVerifyProvider(provider.id, 'APPROVED')}
                          disabled={verifyingId === provider.id}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {verifyingId === provider.id ? 'Processing...' : '✓ Verify'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartReject(provider.id)}
                          disabled={verifyingId === provider.id}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    {rejectingId === provider.id ? (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="text-sm font-semibold text-red-800">Rejected verification reason</div>
                        <p className="mt-1 text-sm text-textSecondary">Please provide the reason for the account rejection, and the action to be taken by the service provider.</p>
                        <textarea
                          value={rejectionReasons[provider.id] ?? ''}
                          onChange={(event) => handleRejectionReasonChange(provider.id, event.target.value)}
                          placeholder="Enter the reason for rejection"
                          className="mt-3 min-h-[120px] w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none"
                        />
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleVerifyProvider(provider.id, 'REJECTED', rejectionReasons[provider.id] ?? null)}
                            disabled={verifyingId === provider.id}
                            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {verifyingId === provider.id ? 'Processing...' : 'Submit rejection'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelReject}
                            disabled={verifyingId === provider.id}
                            className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {actionError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700">{actionError}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'loading' || status === 'idle' ? (
            <div className="ykb-card">
              <p className="text-sm text-textSecondary">Loading service providers…</p>
            </div>
          ) : status === 'error' ? (
            <div className="ykb-card">
              <div className="ykb-alert ykb-alert-error">{error ?? 'Could not load service providers.'}</div>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="ykb-card">
              <div className="ykb-alert ykb-alert-info">No service providers match this service yet.</div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-border">
              <div className="grid grid-cols-1 gap-px md:grid-cols-2 lg:grid-cols-3">
                {filteredProviders.map((p) => (
                  <Link
                    key={p.id}
                    to={`/admin/providers/${p.id}`}
                    className="bg-white p-5 transition-colors hover:bg-surface/60"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h2 className="text-base font-semibold text-primary">{p.businessName ?? p.user?.name ?? 'Service Provider'}</h2>
                        <p className="text-sm text-primary font-medium">{p.mainService ?? '—'}</p>
                      </div>
                      <span className="text-xs text-textSecondary">{p.status}</span>
                    </div>

                    <div className="space-y-1 text-sm text-textSecondary">
                      <div>
                        <span className="font-semibold text-primary">Location:</span> {p.location ?? '—'}
                      </div>
                      <div>
                        <span className="font-semibold text-primary">Email:</span> {p.user?.email ?? '—'}
                      </div>
                      {p.user?.phone ? (
                        <div>
                          <span className="font-semibold text-primary">Phone:</span> {p.user.phone}
                        </div>
                      ) : null}
                      <div>
                        <span className="font-semibold text-primary">Services:</span>{' '}
                        {Array.isArray(p.serviceOfferings) ? p.serviceOfferings.length : 0}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
