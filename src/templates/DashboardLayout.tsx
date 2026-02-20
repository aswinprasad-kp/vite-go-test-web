import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TitleBar from '../components/TitleBar';
import NotificationCenter from '../components/NotificationCenter';
import { getRouteForPath } from '../core-utils/routes';
import { usePermissions } from '../hooks/usePermissions';
import type { UserSession } from '../types/auth';

const { Content } = Layout;

interface DashboardLayoutProps {
  user: UserSession;
  onLogout: () => void;
}

export default function DashboardLayout({ user, onLogout }: DashboardLayoutProps) {
  const location = useLocation();
  const { permissions } = usePermissions();
  const route = getRouteForPath(location.pathname);
  const title = route?.title ?? 'Claims';

  return (
    <Layout className="flex min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100/80">
      <Sidebar user={user} onLogout={onLogout} permissions={permissions} />
      <Layout className="min-w-0 flex flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 py-3 shadow-sm backdrop-blur-sm">
          <TitleBar user={user} title={title} />
          <NotificationCenter />
        </div>
        <Content className="min-h-0 flex-1 overflow-auto p-6">
          <div className="h-full w-full rounded-xl border border-slate-200/60 bg-white p-6 shadow-md shadow-slate-200/40">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
