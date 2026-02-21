import { Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { SIDEBAR_ROUTES } from '../core-utils/routes';
import type { UserSession } from '../types/auth';

const SIDEBAR_WIDTH = 220;

interface SidebarProps {
  user: UserSession;
  onLogout: () => void;
  /** From GET /api/auth/permissions (loaded with layout). */
  permissions?: string[];
  /** Whether the sidebar is open (visible). When false, it slides off-screen or collapses. */
  open?: boolean;
  /** Called when sidebar should close (e.g. overlay click or close button). */
  onClose?: () => void;
  /** When true, render as in-flow column (desktop); when false, render as fixed overlay (mobile). */
  inline?: boolean;
}

export default function Sidebar({ user, onLogout, permissions = [], open = true, onClose, inline = false }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '') || '/';

  const items = SIDEBAR_ROUTES.filter((r) => permissions.includes(r.permission)).map((route) => ({
    key: route.path,
    label: (
      <Link
        to={route.path}
        onClick={() => {
          if (window.innerWidth < 768) {
            onClose?.();
          }
        }}
      >
        {route.label}
      </Link>
    ),
  }));

  const selectedKey = pathname === '/' ? '/claims' : pathname.split('/').slice(0, 2).join('/') || '/claims';
  const selectedKeys = items.some((i) => i.key === selectedKey) ? [selectedKey] : [];

  const content = (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200/80 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--xpense-primary)] to-indigo-600 text-sm font-bold text-white shadow">
          X
        </div>
        <span className="text-lg font-semibold text-slate-800">XpenseOps</span>
      </div>
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        items={items}
        className="mt-2 shrink-0 border-none"
        style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
      />
      <div className="shrink-0 border-t border-slate-200/80 bg-slate-50/80 p-3">
        <p className="truncate text-xs text-slate-500" title={user.email}>
          {user.email}
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          Logout
        </button>
      </div>
    </div>
  );

  if (inline) {
    return (
      <aside
        className="flex h-screen shrink-0 flex-col overflow-hidden border-r border-slate-200/80 bg-white shadow-sm transition-[width] duration-200 ease-out"
        style={{ width: open ? SIDEBAR_WIDTH : 0, minWidth: open ? SIDEBAR_WIDTH : 0 }}
      >
        <div className="h-full w-[220px] overflow-hidden">
          {content}
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Overlay on small screens when sidebar is open */}
      {onClose && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-black/20"
          style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.2s' }}
          onClick={onClose}
        />
      )}
      <aside
        className="fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden border-r border-slate-200/80 bg-white shadow-lg transition-transform duration-200 ease-out"
        style={{
          width: SIDEBAR_WIDTH,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {content}
      </aside>
    </>
  );
}

export { SIDEBAR_WIDTH };
