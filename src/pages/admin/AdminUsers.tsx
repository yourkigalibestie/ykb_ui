import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BackendAuthError } from '../../utils/backendAuth';
import { fetchAdminUsers, type BackendAdminUser } from '../../utils/backendAdmin';

export function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<BackendAdminUser[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const roleFilter = searchParams.get('role') || '';

  const filteredUsers = roleFilter
    ? users.filter((user) => user.role === roleFilter)
    : users;

  const roleCounts = {
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
    PROVIDER: users.filter((u) => u.role === 'PROVIDER').length,
    CUSTOMER: users.filter((u) => u.role === 'CUSTOMER').length,
  };

  const handleRoleFilter = (role: string) => {
    if (role === '') {
      setSearchParams({});
    } else {
      setSearchParams({ role });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadgeColor = (role: string, providerStatus?: string) => {
    if (role === 'ADMIN') return 'bg-purple-100 text-purple-800';
    if (role === 'PROVIDER') {
      if (providerStatus === 'APPROVED') return 'bg-green-100 text-green-800';
      if (providerStatus === 'REJECTED') return 'bg-red-100 text-red-800';
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusText = (role: string, providerStatus?: string) => {
    if (role === 'ADMIN') return 'Admin';
    if (role === 'PROVIDER') {
      return providerStatus || 'PENDING';
    }
    return 'Customer';
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setStatus('loading');
      setError(null);

      try {
        const result = await fetchAdminUsers(roleFilter || undefined);
        if (!mounted) return;
        setUsers(result);
        setStatus('ready');
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof BackendAuthError ? err.message : 'Could not load users.';
        setError(message);
        setStatus('error');
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [roleFilter]);

  return (
    <main className="pt-16">
      {/* Header Section */}
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">
              Manage registered users
            </p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">All Users</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
              View all registered users and their account information with status.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="ykb-section bg-dark-light">
        <div className="ykb-container">
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleRoleFilter('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                roleFilter === ''
                  ? 'bg-primary text-white'
                  : 'bg-white text-textPrimary border border-border hover:bg-gray-50'
              }`}
            >
              All Users ({users.length})
            </button>
            <button
              type="button"
              onClick={() => handleRoleFilter('ADMIN')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                roleFilter === 'ADMIN'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-textPrimary border border-border hover:bg-gray-50'
              }`}
            >
              Admins ({roleCounts.ADMIN})
            </button>
            <button
              type="button"
              onClick={() => handleRoleFilter('PROVIDER')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                roleFilter === 'PROVIDER'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-textPrimary border border-border hover:bg-gray-50'
              }`}
            >
              Providers ({roleCounts.PROVIDER})
            </button>
            <button
              type="button"
              onClick={() => handleRoleFilter('CUSTOMER')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                roleFilter === 'CUSTOMER'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-textPrimary border border-border hover:bg-gray-50'
              }`}
            >
              Customers ({roleCounts.CUSTOMER})
            </button>
          </div>

          {/* Status Messages */}
          {status === 'error' && error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-textSecondary">Loading users...</p>
              </div>
            </div>
          )}

          {/* Users Table */}
          {status === 'ready' && (
            <div className="overflow-x-auto">
              {filteredUsers.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-textSecondary">No users found.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-textSecondary">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-textSecondary">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-textSecondary">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-textSecondary">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-textSecondary">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-textSecondary">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-textPrimary">{user.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-textSecondary">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-textSecondary">{user.phone || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-textPrimary">{user.role}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                              user.role,
                              user.provider?.status
                            )}`}
                          >
                            {getStatusText(user.role, user.provider?.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-textSecondary">{formatDate(user.createdAt)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
