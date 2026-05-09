import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BackendAuthError } from '../../utils/backendAuth';
import { fetchAdminProviderById } from '../../utils/backendAdmin';
import type { BackendProviderProfile, ProviderServiceOffering } from '../../utils/backendProviders';

type PageState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; provider: BackendProviderProfile }
  | { status: 'error'; message: string; statusCode?: number };

export function AdminProviderDetails() {
  const params = useParams();
  const providerId = params.providerId;

  const [state, setState] = useState<PageState>({ status: 'idle' });

  useEffect(() => {
    if (!providerId) {
      setState({ status: 'error', message: 'Provider id is missing.' });
      return;
    }

    let mounted = true;

    const load = async () => {
      setState({ status: 'loading' });
      try {
        const provider = await fetchAdminProviderById(providerId);
        if (!mounted) return;
        setState({ status: 'ready', provider });
      } catch (err) {
        if (!mounted) return;

        if (err instanceof BackendAuthError) {
          setState({ status: 'error', message: err.message, statusCode: err.status });
          return;
        }

        setState({ status: 'error', message: 'Could not load provider.' });
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [providerId]);

  const offerings: ProviderServiceOffering[] = useMemo(() => {
    if (state.status !== 'ready') return [];
    const list = state.provider.serviceOfferings;
    return Array.isArray(list) ? list : [];
  }, [state]);

  return (
    <main className="pt-16">
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Provider details</p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Service Provider</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
              Profile & services
            </p>
          </div>
        </div>
      </section>

      <section className="ykb-section bg-dark-light">
        <div className="ykb-container">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div></div>
            <Link to="/admin/providers" className="ykb-button-outline">
              Back
            </Link>
          </div>

          {state.status === 'loading' || state.status === 'idle' ? (
            <div className="ykb-card">
              <p className="text-sm text-textSecondary">Loading provider…</p>
            </div>
          ) : state.status === 'error' ? (
            <div className="ykb-card">
              <div className="ykb-alert ykb-alert-error">{state.message}</div>
              {state.statusCode === 401 || state.statusCode === 403 ? (
                <div className="mt-4">
                  <Link to="/login" className="ykb-button-primary">
                    Login again
                  </Link>
                </div>
              ) : null}
            </div>
          ) : state.status === 'ready' ? (
            <div className="grid grid-cols-1 gap-6">
              <section className="ykb-card">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">Profile</div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-xs text-textSecondary">Status</div>
                    <div className="font-semibold text-gray-900">{state.provider.status}</div>
                  </div>
                  <div>
                    <div className="text-xs text-textSecondary">Business name</div>
                    <div className="font-semibold text-gray-900">{state.provider.businessName ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-textSecondary">Main service</div>
                    <div className="font-semibold text-gray-900">{state.provider.mainService ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-textSecondary">Location</div>
                    <div className="font-semibold text-gray-900">{state.provider.location ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-textSecondary">Money range</div>
                    <div className="font-semibold text-gray-900">{state.provider.moneyRange ?? '—'}</div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">Account</div>
                    <div className="mt-2 space-y-2">
                      <div>
                        <div className="text-xs text-textSecondary">Name</div>
                        <div className="font-semibold text-gray-900">{state.provider.user?.name ?? '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-textSecondary">Email</div>
                        <div className="font-semibold text-gray-900 break-words">{state.provider.user?.email ?? '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-textSecondary">Phone</div>
                        <div className="font-semibold text-gray-900">{state.provider.user?.phone ?? '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="ykb-card">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">Services</div>
                <h2 className="mt-2 text-xl font-semibold text-primary">Services provided</h2>

                <div className="mt-4">
                  {offerings.length > 0 ? (
                    <div className="divide-y divide-border rounded-lg border border-border bg-white">
                      {offerings.map((item, index) => (
                        <div key={`${item.name}-${index}`} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900">{item.name}</div>
                              {item.description ? (
                                <div className="mt-1 text-sm text-textSecondary whitespace-pre-wrap">{item.description}</div>
                              ) : (
                                <div className="mt-1 text-sm text-textSecondary">No description.</div>
                              )}
                            </div>
                            <div className="shrink-0 font-semibold text-primary">{item.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ykb-alert ykb-alert-info">No services listed yet.</div>
                  )}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
