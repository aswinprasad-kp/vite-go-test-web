/**
 * Route and permission config. Single source for paths and required FE permissions.
 * Used by RouteProtector, Sidebar, and for building permission keys from URLs.
 */

export interface RouteConfig {
  path: string;
  /** Required FE permission (xpensepanel:...) to access this route. */
  permission: string;
  label: string;
  sidebar: boolean;
  /** Title for the header. */
  title: string;
}

/** All app routes and their required permissions. Add new routes here. */
export const ROUTES: RouteConfig[] = [
  {
    path: '/claims',
    permission: 'xpensepanel:claims:view',
    label: 'Claims',
    sidebar: true,
    title: 'Claims',
  },
  {
    path: '/reports',
    permission: 'xpensepanel:reports:view',
    label: 'SpendLens',
    sidebar: true,
    title: 'SpendLens',
  },
  {
    path: '/admin',
    permission: 'xpensepanel:admin:admin',
    label: 'Admin',
    sidebar: true,
    title: 'Admin',
  },
];

/** Routes that appear in the sidebar (sidebar === true). */
export const SIDEBAR_ROUTES = ROUTES.filter((r) => r.sidebar);

/**
 * Get required permission for a path. Exact match first, then prefix match for dynamic segments.
 * e.g. /claims -> xpensepanel:claims:view; /admin -> xpensepanel:admin:admin
 */
export function getPermissionForPath(pathname: string): string | undefined {
  const normalized = pathname.replace(/\/$/, '') || '/';
  const exact = ROUTES.find((r) => r.path === normalized);
  if (exact) return exact.permission;
  // Future: match dynamic routes, e.g. /claims/123 -> same as /claims
  const base = normalized.split('/').slice(0, 2).join('/') || '/';
  const baseMatch = ROUTES.find((r) => base === r.path || normalized.startsWith(r.path + '/'));
  return baseMatch?.permission;
}

/**
 * Build a permission key from a URL path (for future dynamic routes).
 * Example: "xpensepanel/abcd-efgh/claim/1/view" -> pattern "xpensepanel/abcd-efgh/claim/:id/view"
 * -> scope=xpensepanel, resource=abcdefghclaim (remove - and /), action=view
 * -> "xpensepanel:abcdefghclaim:view"
 * For now we use ROUTES config; this helper is for when we add dynamic paths.
 */
export function pathToPermissionKey(
  pathname: string,
  scope: string = 'xpensepanel',
  action: string = 'view'
): string {
  const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  if (segments.length === 0) return `${scope}:claims:${action}`;
  const resource = segments
    .slice(1, -1)
    .join('')
    .replace(/[-/]/g, '')
    .toLowerCase() || segments[0]?.toLowerCase() || 'claims';
  const act = segments[segments.length - 1]?.toLowerCase() || action;
  return `${scope}:${resource}:${act}`;
}

/** Get route config by path. */
export function getRouteForPath(pathname: string): RouteConfig | undefined {
  const normalized = pathname.replace(/\/$/, '') || '/';
  return ROUTES.find((r) => r.path === normalized) ?? ROUTES.find((r) => normalized.startsWith(r.path + '/'));
}
