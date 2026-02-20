import { Layout } from 'antd';
import Sidebar from '../components/Sidebar';
import TitleBar from '../components/TitleBar';
import NotificationCenter from '../components/NotificationCenter';
import type { UserSession } from '../types/auth';

const { Content } = Layout;

interface DashboardLayoutProps {
  user: UserSession;
  onLogout: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function DashboardLayout({
  user,
  onLogout,
  title = 'Claims',
  children,
}: DashboardLayoutProps) {
  return (
    <Layout className="flex min-h-screen w-full bg-gray-50">
      <Sidebar user={user} onLogout={onLogout} />
      <Layout className="min-w-0 flex flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-2">
          <TitleBar user={user} title={title} />
          <NotificationCenter />
        </div>
        <Content className="min-h-0 flex-1 overflow-auto p-6">
          <div className="h-full w-full rounded-lg bg-white p-6 shadow-sm">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
