import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isBackendAdmin } from '../utils/backendAuth';

export function RequireAdmin() {
  const location = useLocation();

  if (!isBackendAdmin()) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
