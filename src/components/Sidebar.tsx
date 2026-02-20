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
      className="min-h-screen border-r bg-[var(--xpense-sidebar-bg)] [border-color:var(--xpense-border)]"
    >
      <div className="flex h-16 items-center border-b px-4 [border-color:var(--xpense-border)]">
        <span className="text-lg font-semibold [color:var(--xpense-text)]">XpenseOps</span>
      </div>
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        items={items}
        className="mt-2 border-none"
        style={{ height: 'calc(100vh - 8rem)' }}
      />
      <div className="absolute bottom-0 left-0 right-0 border-t bg-[var(--xpense-sidebar-bg)] p-3 [border-color:var(--xpense-border)]">
        <p className="truncate text-xs [color:var(--xpense-text-muted)]" title={user.email}>
          {user.email}
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-2 w-full rounded border px-3 py-1.5 text-sm font-medium shadow-sm [background:var(--xpense-btn-secondary-bg)] [border-color:var(--xpense-btn-secondary-border)] [color:var(--xpense-btn-secondary-text)] hover:[background:var(--xpense-btn-secondary-hover-bg)]"
        >
          Logout
        </button>
      </div>
    </Sider>
  );
}
