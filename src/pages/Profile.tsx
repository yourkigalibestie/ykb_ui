import { useEffect, useState, type ReactNode } from 'react';
import { MapPin, Mail, Phone, Shield, UserCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBackendSession, fetchBackendMe, type BackendUser } from '../utils/backendAuth';
import { fetchProviderMeProfile, type BackendProviderProfile } from '../utils/backendProviders';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function FieldRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2">
      {icon ? <div className="mt-0.5 text-primary">{icon}</div> : null}
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-textSecondary">{label}</div>
        <div className="text-sm text-gray-900 break-words">{value}</div>
      </div>
    </div>
  );
}

export function Profile() {
  const backendSession = getBackendSession();
  const isBackendAuthenticated = Boolean(backendSession?.accessToken);

  const [backendUser, setBackendUser] = useState<BackendUser | null>(backendSession?.user ?? null);
  const [backendProvider, setBackendProvider] = useState<BackendProviderProfile | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!isBackendAuthenticated) return;

      try {
        const user = await fetchBackendMe();
        if (!mounted) return;

        setBackendUser(user);

        if (user.role === 'PROVIDER') {
          const provider = await fetchProviderMeProfile();
          if (!mounted) return;
          setBackendProvider(provider);
        } else {
          setBackendProvider(null);
        }
      } catch (err) {
        if (!mounted) return;
        setBackendProvider(null);
        setBackendUser(backendSession?.user ?? null);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [backendSession?.user?.role, isBackendAuthenticated]);

  const currentRole = backendUser?.role ?? backendSession?.user?.role ?? 'CUSTOMER';
  const displayName = backendUser?.name ?? backendSession?.user?.name ?? 'Profile';
  const profileImageUrl = backendProvider?.profileImageUrl ?? null;

  return (
    <main className="pt-16">
      <section className="ykb-section px-2 sm:px-6 lg:px-8 bg-dark-light">
        <h1 className='text-3xl md:text-4xl font-serif text-start font-bold text-primary mb-2'>Profile</h1>
        <div className="ykb-container mx-0">
          <div className="grid grid-cols-1 gap-6">
            <div className="ykb-card p-4">
              {isBackendAuthenticated ? (
                <div className="mb-4 rounded-md border border-border bg-surface px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-textSecondary">Backend session</div>
                  <div className="mt-1 text-sm text-gray-900 break-words">{backendSession?.user?.email}</div>
                  <div className="mt-1 text-xs text-textSecondary">
                    Role: <span className="font-semibold text-primary">{currentRole}</span>
                  </div>
                </div>
              ) : null}

              {!isBackendAuthenticated ? (
                <div className="ykb-alert ykb-alert-info">
                  Please log in to view your profile.
                  <div className="mt-4">
                    <Link to="/login" className="ykb-button-primary">Go to login</Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt={displayName}
                          className="h-14 w-14 rounded-xl object-cover border border-border"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                          <span className="text-black font-bold">{getInitials(displayName)}</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-primary">{displayName}</h2>
                        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                          <Shield className="w-4 h-4" />
                          {currentRole === 'PROVIDER' ? 'Service Provider' : currentRole === 'ADMIN' ? 'Admin' : 'Customer'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-textSecondary">
                        {currentRole === 'PROVIDER'
                          ? 'Your live provider profile from the backend.'
                          : 'Your account profile from the backend.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <FieldRow label="Name" value={backendUser?.name ?? 'N/A'} icon={<UserCircle2 className="w-4 h-4" />} />
                    <FieldRow label="Email" value={backendUser?.email ?? 'N/A'} icon={<Mail className="w-4 h-4" />} />
                    <FieldRow label="Phone" value={backendUser?.phone ?? 'N/A'} icon={<Phone className="w-4 h-4" />} />
                    <FieldRow label="Role" value={currentRole} />
                  </div>

                  {currentRole === 'PROVIDER' ? (
                    <>
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <FieldRow label="Business Name" value={backendProvider?.businessName ?? 'N/A'} />
                        <FieldRow label="Main Service" value={backendProvider?.mainService ?? 'N/A'} />
                        <FieldRow label="Location" value={backendProvider?.location ?? 'N/A'} icon={<MapPin className="w-4 h-4" />} />
                        <FieldRow label="Money Range" value={backendProvider?.moneyRange ?? 'N/A'} />
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
