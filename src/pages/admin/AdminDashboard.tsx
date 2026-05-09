import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BackendAuthError } from '../../utils/backendAuth';
import {
  fetchAdminProviders,
  fetchAdminRequests,
  fetchAdminBookings,
  fetchAdminPayments,
  type BackendAdminBooking,
  type BackendAdminPayment
} from '../../utils/backendAdmin';
import type { BackendProviderProfile } from '../../utils/backendProviders';
import type { BackendAdminRequest } from '../../utils/backendAdmin';

export function AdminDashboard() {
  const [providers, setProviders] = useState<BackendProviderProfile[]>([]);
  const [requests, setRequests] = useState<BackendAdminRequest[]>([]);
  const [bookings, setBookings] = useState<BackendAdminBooking[]>([]);
  const [payments, setPayments] = useState<BackendAdminPayment[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      setStatus('loading');
      setError(null);

      try {
        const [providersData, requestsData, bookingsData, paymentsData] = await Promise.all([
          fetchAdminProviders(),
          fetchAdminRequests(),
          fetchAdminBookings(),
          fetchAdminPayments()
        ]);

        if (!mounted) return;

        setProviders(providersData);
        setRequests(requestsData);
        setBookings(bookingsData);
        setPayments(paymentsData);
        setStatus('ready');
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof BackendAuthError ? err.message : 'Could not load dashboard data.';
        setError(message);
        setStatus('error');
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  // Calculate statistics
  const totalProviders = providers.length;
  const verifiedProviders = providers.filter(p => p.status === 'VERIFIED').length;
  const pendingProviders = providers.filter(p => p.status === 'PENDING').length;

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const resolvedRequests = requests.filter(r => r.status === 'RESOLVED').length;

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;

  const completedPayments = payments.filter(p => p.status === 'COMPLETED').length;
  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <main className="pt-16">
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Admin overview</p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Dashboard</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
              Manage your concierge service platform from here.
            </p>
          </div>
        </div>
      </section>

      {status === 'loading' && (
        <section className="ykb-section">
          <div className="ykb-container">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
                <p className="text-textSecondary">Loading dashboard data...</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {status === 'error' && (
        <section className="ykb-section">
          <div className="ykb-container">
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </section>
      )}

      {status === 'ready' && (
        <>
          {/* Statistics Cards */}
          <section className="ykb-section bg-dark-light">
            <div className="ykb-container">
              <h2 className="text-2xl font-semibold text-primary mb-6">Overview</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Providers Card */}
                <div className="rounded-lg border border-border bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-textSecondary">Service Providers</p>
                      <p className="text-3xl font-bold text-primary">{totalProviders}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-green-600">✓ {verifiedProviders} verified</span>
                    <span className="text-yellow-600">⏳ {pendingProviders} pending</span>
                  </div>
                </div>

                {/* Requests Card */}
                <div className="rounded-lg border border-border bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-textSecondary">Client Requests</p>
                      <p className="text-3xl font-bold text-primary">{totalRequests}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-yellow-600">⏳ {pendingRequests} pending</span>
                    <span className="text-green-600">✓ {resolvedRequests} resolved</span>
                  </div>
                </div>

                {/* Bookings Card */}
                <div className="rounded-lg border border-border bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-textSecondary">Bookings</p>
                      <p className="text-3xl font-bold text-primary">{totalBookings}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-green-600">
                    ✓ {confirmedBookings} confirmed bookings
                  </div>
                </div>

                {/* Revenue Card */}
                <div className="rounded-lg border border-border bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-textSecondary">Revenue</p>
                      <p className="text-3xl font-bold text-primary">{totalRevenue.toLocaleString()} RWF</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-green-600">
                    ✓ {completedPayments} successful payments
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Management Links */}
          <section className="ykb-section bg-dark-light">
            <div className="ykb-container">
              <h2 className="text-2xl font-semibold text-primary mb-6">Management</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Link to="/admin/providers" className="group block bg-white p-6 rounded-lg border border-border shadow-sm transition-all hover:shadow-md hover:border-secondary/20">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary mb-2 group-hover:text-secondary transition-colors">Service Providers</h3>
                      <p className="text-sm text-textSecondary leading-relaxed">View and manage service providers registered under different services.</p>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-textSecondary group-hover:text-secondary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link to="/admin/requests" className="group block bg-white p-6 rounded-lg border border-border shadow-sm transition-all hover:shadow-md hover:border-secondary/20">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary mb-2 group-hover:text-secondary transition-colors">Client Requests</h3>
                      <p className="text-sm text-textSecondary leading-relaxed">Review and manage client service requests submitted through the app.</p>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-textSecondary group-hover:text-secondary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link to="/admin/translators" className="group block bg-white p-6 rounded-lg border border-border shadow-sm transition-all hover:shadow-md hover:border-secondary/20">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary mb-2 group-hover:text-secondary transition-colors">Translator Languages</h3>
                      <p className="text-sm text-textSecondary leading-relaxed">Create languages and set dynamic pricing for translation services.</p>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-textSecondary group-hover:text-secondary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link to="/admin/starter-guide" className="group block bg-white p-6 rounded-lg border border-border shadow-sm transition-all hover:shadow-md hover:border-secondary/20">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary mb-2 group-hover:text-secondary transition-colors">Starter Guide Categories</h3>
                      <p className="text-sm text-textSecondary leading-relaxed">Create categories with subcategories for clinics, hospitals, pharmacies, and more.</p>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-textSecondary group-hover:text-secondary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
