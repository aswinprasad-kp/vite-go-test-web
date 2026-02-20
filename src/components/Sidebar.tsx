import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { SIDEBAR_ROUTES } from '../core-utils/routes';
import type { UserSession } from '../types/auth';

const { Sider } = Layout;

interface SidebarProps {
  user: UserSession;
  onLogout: () => void;
  /** From GET /api/auth/permissions (loaded with layout). */
  permissions?: string[];
}

export default function Sidebar({ user, onLogout, permissions = [] }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '') || '/';

  const items = SIDEBAR_ROUTES.filter((r) => permissions.includes(r.permission)).map((route) => ({
    key: route.path,
    label: <Link to={route.path}>{route.label}</Link>,
  }));

  const selectedKey = pathname === '/' ? '/claims' : pathname.split('/').slice(0, 2).join('/') || '/claims';
  const selectedKeys = items.some((i) => i.key === selectedKey) ? [selectedKey] : [];

  return (
    <Sider
      theme="light"
      width={220}
      className="min-h-screen border-r border-slate-200/80 bg-white shadow-sm"
    >
      <div className="flex h-16 items-center gap-2 border-b border-slate-200/80 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--xpense-primary)] to-indigo-600 text-sm font-bold text-white shadow">
          X
        </div>
        <span className="text-lg font-semibold text-slate-800">XpenseOps</span>
      </div>
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        items={items}
        className="mt-2 border-none"
        style={{ height: 'calc(100vh - 8rem)' }}
      />
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200/80 bg-slate-50/80 p-3">
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
    </Sider>
  );
}
