import { ConfigProvider } from 'antd';
import { SWRConfig } from 'swr';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { axiosInstance } from './core-utils/axiosInstance';
import { themeTokens } from './core-utils/theme';
import { useAuth } from './hooks/useAuth';
import Login from './Login';
import DashboardLayout from './templates/DashboardLayout';
import RouteProtector from './components/RouteProtector';
import ClaimsPage from './pages/ClaimsPage';
import AdminPage from './pages/AdminPage';

function fetcher(url: string) {
  return axiosInstance.get(url).then((res) => res.data);
}

function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return <DashboardLayout user={user} onLogout={logout} />;
}

export default function App() {
  const { user, setSession } = useAuth();

  if (!user) {
    return (
      <ConfigProvider theme={{ token: themeTokens }}>
        <Login onAuthSuccess={setSession} />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={{ token: themeTokens }}>
      <SWRConfig value={{ fetcher }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthenticatedLayout />}>
              <Route index element={<Navigate to="/claims" replace />} />
              <Route
                path="claims"
                element={
                  <RouteProtector>
                    <ClaimsPage />
                  </RouteProtector>
                }
              />
              <Route
                path="admin"
                element={
                  <RouteProtector>
                    <AdminPage />
                  </RouteProtector>
                }
              />
              <Route
                path="reports"
                element={
                  <RouteProtector>
                    <div className="rounded border border-gray-200 bg-gray-50 p-6 text-gray-600">
                      Reports (coming soon)
                    </div>
                  </RouteProtector>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/claims" replace />} />
          </Routes>
        </BrowserRouter>
      </SWRConfig>
    </ConfigProvider>
  );
}
