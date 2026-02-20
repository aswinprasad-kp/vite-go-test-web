import { useLocation } from 'react-router-dom';
import { getPermissionForPath } from '../core-utils/routes';
import { usePermissions } from '../hooks/usePermissions';
import AccessDeniedPage from '../pages/AccessDeniedPage';

interface RouteProtectorProps {
  children: React.ReactNode;
  /** If set, use this instead of deriving from path. */
  requiredPermission?: string;
}

/**
 * Guards a route by permission. On every page switch, checks current path's required permission
 * against GET /api/auth/permissions. If missing, renders AccessDeniedPage.
 */
export default function RouteProtector({ children, requiredPermission }: RouteProtectorProps) {
  const location = useLocation();
  const { permissions, isLoading, error } = usePermissions();

  const permission = requiredPermission ?? getPermissionForPath(location.pathname);
  if (permission == null) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span className="text-[var(--xpense-text-secondary)]">Loading…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
        Failed to load permissions. You may need to sign in again.
      </div>
    );
  }

  if (!permissions.includes(permission)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
