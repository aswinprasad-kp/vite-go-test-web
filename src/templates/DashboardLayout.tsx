import { useState, useEffect } from 'react';
import { MenuOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.tsx';
import TitleBar from '../components/TitleBar';
import NotificationCenter from '../components/NotificationCenter';
import DevImpersonate from '../components/DevImpersonate.tsx';
import { getRouteForPath } from '../core-utils/routes';
import { usePermissions } from '../hooks/usePermissions';
import type { UserSession } from '../types/auth';

const MD_BREAKPOINT = 768;

function useSidebarDefaultByViewport() {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < MD_BREAKPOINT : false
  );
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= MD_BREAKPOINT : true
  );

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < MD_BREAKPOINT;
      setIsMobile(mobile);
      // Auto-open/close on resize only when crossing breakpoint
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return [sidebarOpen, setSidebarOpen, isMobile] as const;
}

interface DashboardLayoutProps {
  user: UserSession;
  onLogout: () => void;
  setSession?: (session: UserSession | null) => void;
}

export default function DashboardLayout({ user, onLogout, setSession }: DashboardLayoutProps) {
  const location = useLocation();
  const { permissions } = usePermissions();
  const route = getRouteForPath(location.pathname);
  const title = route?.title ?? 'Claims';
  const [sidebarOpen, setSidebarOpen, isMobile] = useSidebarDefaultByViewport();

  return (
    <div className="flex h-screen w-full flex-row overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100/80">
      <Sidebar
        user={user}
        onLogout={onLogout}
        permissions={permissions}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        inline={!isMobile}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            />
            <TitleBar user={user} title={title} />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {setSession && <DevImpersonate currentUser={user} setSession={setSession} />}
            <NotificationCenter />
          </div>
        </header>
        <main className="min-h-0 min-w-0 flex-1 overflow-auto p-4 sm:p-6">
          <div className="w-full min-w-0 rounded-xl border border-slate-200/60 bg-white p-4 shadow-md shadow-slate-200/40 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
