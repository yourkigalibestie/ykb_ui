import { Link } from 'react-router-dom';
import { getBackendSession } from '../../utils/backendAuth';

export function StarterDashboard() {
  const session = getBackendSession();
  const name = session?.user?.name || session?.user?.email || 'Starter';

  return (
    <main className="pt-16">
      <section className="ykb-section bg-dark-light">
        <div className="ykb-container">
          <div className="ykb-card p-6">
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Dashboard</h1>
            <p className="mt-2 text-textSecondary">Welcome, {name}.</p>

            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              <Link to="/profile/requests" className="ykb-button-solid px-4 py-2 text-center">
                My requests
              </Link>
              <Link to="/profile/profile" className="ykb-button-outline px-4 py-2 text-center">
                Profile
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
