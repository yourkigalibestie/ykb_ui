import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE, BackendAuthError, getBackendAuthHeaders } from '../../utils/backendAuth';
import type { BackendAdminRequest } from '../../utils/backendAdmin';
import { useTranslation } from 'react-i18next';

type TabType = 'received' | 'my-requests';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatBudget(value: BackendAdminRequest['budget'], t: (key: string) => string): string {
  if (value == null) return t('provider.notAvailable');
  if (typeof value === 'number' && Number.isFinite(value)) return value.toLocaleString();
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return t('provider.notAvailable');
}

function deriveRequestTitle(request: BackendAdminRequest, t: (key: string) => string): string {
  const description = request.description ?? '';
  const match = description.match(/^Service:\s*(.+)$/m);
  const service = match?.[1]?.trim();
  return service && service.length > 0 ? service : t('provider.serviceRequestFallback');
}

export function ProviderRequests() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [receivedRequests, setReceivedRequests] = useState<BackendAdminRequest[]>([]);
  const [myRequests, setMyRequests] = useState<BackendAdminRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [receivedRes, myRes] = await Promise.all([
        fetch(`${API_BASE}/requests/assigned/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getBackendAuthHeaders(),
          },
        }),
        fetch(`${API_BASE}/requests/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getBackendAuthHeaders(),
          },
        }),
      ]);

      let hasError = false;

      if (!receivedRes.ok) {
        if (receivedRes.status === 401) {
          setError(t('provider.pleaseLoginProvider'));
        } else if (receivedRes.status === 403) {
          setError(t('provider.onlyProvidersCanView'));
        } else {
          setError(t('provider.failedToLoadRequests', { status: receivedRes.status }));
        }
        hasError = true;
      } else {
        const receivedData = (await receivedRes.json()) as { requests?: BackendAdminRequest[] };
        if (Array.isArray(receivedData?.requests)) {
          setReceivedRequests(receivedData.requests);
        }
      }

      if (!myRes.ok) {
        if (!hasError) {
          setError(t('provider.failedToLoadYourRequests', { status: myRes.status }));
        }
      } else {
        const myData = (await myRes.json()) as { requests?: BackendAdminRequest[] };
        if (Array.isArray(myData?.requests)) {
          setMyRequests(myData.requests);
        }
      }

      if (!receivedRes.ok || !myRes.ok) {
        return;
      }
      setError(null);
    } catch (err) {
        if (err instanceof BackendAuthError) {
          setError(err.message);
        } else if (err instanceof Error) {
          if (err.message.includes('Failed to fetch')) {
            setError(t('provider.couldNotReachBackend'));
          } else {
            setError(err.message);
          }
        } else {
          setError(t('provider.unexpectedError'));
        }
      setReceivedRequests([]);
      setMyRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markResolved = useCallback(
    async (requestId: string) => {
      setUpdatingId(requestId);
      setActionError(null);

      const updated = activeTab === 'received' ? [...receivedRequests] : [...myRequests];
      const idx = updated.findIndex((r) => r.id === requestId);
      if (idx === -1) return;

      const original = updated[idx];
      updated[idx] = { ...original, providerResolvedAt: new Date().toISOString() };
      if (activeTab === 'received') setReceivedRequests(updated);
      else setMyRequests(updated);

      try {
        const res = await fetch(`${API_BASE}/requests/${encodeURIComponent(requestId)}/provider-mark-resolved`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getBackendAuthHeaders(),
          },
        });

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        const json = (await res.json()) as { request?: BackendAdminRequest };
        if (json?.request?.id) {
          if (activeTab === 'received') {
            setReceivedRequests((prev) => prev.map((r) => (r.id === requestId ? json.request! : r)));
          } else {
            setMyRequests((prev) => prev.map((r) => (r.id === requestId ? json.request! : r)));
          }
        }
      } catch (err) {
        if (activeTab === 'received') setReceivedRequests([...updated]);
        else setMyRequests([...updated]);
        setActionError(err instanceof Error ? err.message : t('provider.couldNotMarkResolved'));
      } finally {
        setUpdatingId(null);
      }
    },
    [activeTab, receivedRequests, myRequests]
  );

  useEffect(() => {
    void loadRequests();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void loadRequests();
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [loadRequests]);

  const displayRequests = useMemo(() => {
    return activeTab === 'received' ? receivedRequests : myRequests;
  }, [activeTab, receivedRequests, myRequests]);

  const RequestsList = ({ requests }: { requests: BackendAdminRequest[] }) => (
    <>
      {requests.length === 0 ? (
        <div className="ykb-card p-6 text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">{t('provider.noRequestsYet')}</h2>
          <p className="text-textSecondary">
            {activeTab === 'received' ? t('provider.adminWillAssign') : t('provider.notCreatedRequests')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {requests.map((r) => (
            <div key={r.id} className="ykb-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-primary">{deriveRequestTitle(r, t)}</h2>
                  <p className="text-textSecondary text-sm">{formatDate(r.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-textSecondary">{r.id}</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary">
                    {r.status === 'PENDING' ? t('provider.statusPending') : r.status === 'APPROVED' ? t('provider.statusApproved') : r.status === 'REJECTED' ? t('provider.statusRejected') : r.status === 'IN_REVIEW' ? t('provider.statusInReview') : r.status === 'ACCEPTED' ? t('provider.statusAccepted') : r.status === 'COMPLETED' ? t('provider.statusCompleted') : r.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {activeTab === 'received' ? (
                  <>
                    <div className="text-textSecondary">
                      <span className="font-semibold text-primary">{t('provider.clientLabel')}:</span> {r.user?.name || r.user?.email || t('provider.notAvailable')}
                    </div>
                    <div className="text-textSecondary">
                      <span className="font-semibold text-primary">{t('provider.phoneField')}:</span> {r.user?.phone || t('provider.notAvailable')}
                    </div>
                  </>
                ) : null}
                <div className="text-textSecondary">
                  <span className="font-semibold text-primary">{t('provider.locationLabel')}:</span> {r.location}
                </div>
                <div className="text-textSecondary">
                  <span className="font-semibold text-primary">{t('provider.preferredDateLabel')}:</span>{' '}
                  {r.preferredDate ? formatDate(r.preferredDate) : t('provider.notAvailable')}
                </div>
                <div className="text-textSecondary">
                  <span className="font-semibold text-primary">{t('provider.budgetLabel')}:</span> {formatBudget(r.budget, t)}
                </div>
                <div className="text-textSecondary">
                  <span className="font-semibold text-primary">{t('provider.detailsLabel')}:</span> {r.description}
                </div>
                {r.customerNotes ? (
                  <div className="text-textSecondary whitespace-pre-wrap">
                    <span className="font-semibold text-primary">{t('provider.customerNotes')}:</span> {r.customerNotes}
                  </div>
                ) : null}
                {r.adminNotes ? (
                  <div className="text-textSecondary">
                    <span className="font-semibold text-primary">{t('provider.adminNotes')}:</span> {r.adminNotes}
                  </div>
                ) : null}
              </div>

              {activeTab === 'received' && (
                <div className="mt-4 flex gap-2">
                  <button type="button" className="flex-1 ykb-button-solid py-2 px-3 text-sm rounded-lg">
                    {t('provider.acceptRequest')}
                  </button>
                  <button type="button" className="flex-1 ykb-button-outline py-2 px-3 text-sm rounded-lg">
                    {t('provider.decline')}
                  </button>
                </div>
              )}

              {r.status === 'IN_REVIEW' && !r.providerResolvedAt && (
                <button
                  type="button"
                  onClick={() => void markResolved(r.id)}
                  disabled={updatingId === r.id}
                  className="mt-4 w-full ykb-button-solid py-2 px-3 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingId === r.id ? t('provider.markingAsResolved') : t('provider.markAsResolved')}
                </button>
              )}

              {r.providerResolvedAt && (
                <div className="mt-4 p-3 rounded bg-yellow-100 border border-yellow-300 text-sm text-yellow-900">
                  ✓ {t('provider.markedAsResolved', { date: formatDate(r.providerResolvedAt) })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <main className="pt-16">
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">{t('provider.dashboard')}</p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">{t('provider.serviceRequests')}</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
              {t('provider.viewAssignedRequests')}
            </p>
          </div>
        </div>
      </section>

      <section className="ykb-section bg-dark-light">
        <div className="ykb-container">
          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('received')}
              className={`pb-2 px-4 font-semibold text-sm transition-colors ${
                activeTab === 'received'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-textSecondary hover:text-primary'
              }`}
            >
              {t('provider.receivedRequests')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my-requests')}
              className={`pb-2 px-4 font-semibold text-sm transition-colors ${
                activeTab === 'my-requests'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-textSecondary hover:text-primary'
              }`}
            >
              {t('provider.myRequests')}
            </button>
          </div>

          {error ? (
            <div className="ykb-card p-6 text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">{t('provider.couldNotLoadRequests')}</h2>
              <p className="text-textSecondary">{error}</p>
            </div>
          ) : (
            <>
              {actionError && (
                <div className="mb-4 p-4 rounded bg-red-100 border border-red-300 text-sm text-red-900">
                  {actionError}
                </div>
              )}
              {isLoading ? (
                <div className="ykb-card p-6 text-center">
                  <h2 className="text-2xl font-bold text-primary mb-2">{t('provider.loading')}</h2>
                  <p className="text-textSecondary">{t('provider.loadingRequests')}</p>
                </div>
              ) : (
                <RequestsList requests={displayRequests} />
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
