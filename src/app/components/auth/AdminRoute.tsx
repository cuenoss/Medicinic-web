import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * Like ProtectedRoute, but also requires the logged-in account to be an admin.
 * - Not logged in  -> redirected to login
 * - Logged in, not admin -> redirected to the dashboard (no admin page at all)
 * - Logged in admin -> renders the page
 *
 * Note: this is a UX guard only. The real protection is the backend, which
 * re-checks ADMIN_EMAILS on every /api/admin request and returns 403.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!user.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
