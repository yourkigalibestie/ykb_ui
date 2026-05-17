import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BackendAuthError } from '../../utils/backendAuth';
import { LoadingSpinner } from '../../components/LoadingSpinner';
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
            <LoadingSpinner size="lg" text="Loading dashboard data..." centered />
          </div>
        </section>
      )}

      {status === 'error' && (
        <section className="ykb-section">
          <div className="ykb-container">
            <div className="ykb-alert ykb-alert-error">
              <h3 className="font-semibold mb-2">Error Loading Dashboard</h3>
              <p>{error}</p>
            </div>
          </div>
        </section>
      )}

      {status === 'ready' && (
        <>
          {/* Statistics Cards */}
          <section className="ykb-section">
            <div className="ykb-container">
              <h2 className="text-2xl font-semibold text-primary mb-6">Overview</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Providers Card */}
                <div className="ykb-card border-t-4 border-t-primary">
                  <p className="text-sm font-medium text-textSecondary">Service Providers</p>
                  <p className="mt-2 text-3xl font-bold text-primary">{totalProviders}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-textSecondary">Verified</span>
                    <span className="font-semibold text-primary">{verifiedProviders}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-textSecondary">Pending</span>
                    <span className="font-semibold text-primary">{pendingProviders}</span>
                  </div>
                </div>

                {/* Requests Card */}
                <div className="ykb-card border-t-4 border-t-secondary">
                  <p className="text-sm font-medium text-textSecondary">Client Requests</p>
                  <p className="mt-2 text-3xl font-bold text-primary">{totalRequests}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-textSecondary">Pending</span>
                    <span className="font-semibold text-primary">{pendingRequests}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-textSecondary">Resolved</span>
                    <span className="font-semibold text-primary">{resolvedRequests}</span>
                  </div>
                </div>

                {/* Bookings Card */}
                <div className="ykb-card border-t-4 border-t-primary/70">
                  <p className="text-sm font-medium text-textSecondary">Bookings</p>
                  <p className="mt-2 text-3xl font-bold text-primary">{totalBookings}</p>
                  <div className="mt-4 text-sm text-textSecondary">
                    Confirmed bookings: <span className="font-semibold text-primary">{confirmedBookings}</span>
                  </div>
                </div>

                {/* Revenue Card */}
                <div className="ykb-card border-t-4 border-t-secondary/70">
                  <p className="text-sm font-medium text-textSecondary">Revenue</p>
                  <p className="mt-2 text-3xl font-bold text-primary">{totalRevenue.toLocaleString()} RWF</p>
                  <div className="mt-4 text-sm text-textSecondary">
                    Successful payments: <span className="font-semibold text-primary">{completedPayments}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Management Links */}
          <section className="ykb-section">
            <div className="ykb-container">
              <h2 className="text-2xl font-semibold text-primary mb-6">Management</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Link to="/admin/providers" className="group block ykb-card ykb-card-hover">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary mb-2">Service Providers</h3>
                      <p className="text-sm text-textSecondary leading-relaxed">View and manage service providers registered under different services.</p>
                    </div>
                  </div>
                </Link>

                <Link to="/admin/requests" className="group block ykb-card ykb-card-hover">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary mb-2">Client Requests</h3>
                      <p className="text-sm text-textSecondary leading-relaxed">Review and manage client service requests submitted through the app.</p>
                    </div>
                  </div>
                </Link>

                <Link to="/admin/translators" className="group block ykb-card ykb-card-hover">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary mb-2">Translator Languages</h3>
                      <p className="text-sm text-textSecondary leading-relaxed">Create languages and set dynamic pricing for translation services.</p>
                    </div>
                  </div>
                </Link>

                <Link to="/admin/starter-guide" className="group block ykb-card ykb-card-hover">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary mb-2">Starter Guide Categories</h3>
                      <p className="text-sm text-textSecondary leading-relaxed">Create categories with subcategories for clinics, hospitals, pharmacies, and more.</p>
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
