import { ConfigProvider } from 'antd';
import { SWRConfig } from 'swr';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { axiosInstance } from './core-utils/axiosInstance';
import { DEFAULT_ROUTE_PATH } from './core-utils/routes';
import { themeTokens } from './core-utils/theme';
import { useAuth } from './hooks/useAuth';
import Login from './Login';
import DashboardLayout from './templates/DashboardLayout';
import RouteProtector from './components/RouteProtector';
import ClaimsPage from './pages/ClaimsPage';
import AdminPage from './pages/AdminPage';
import ReportsPage from './pages/ReportsPage';
import TeamsPage from './pages/TeamsPage';
import GroupsPage from './pages/GroupsPage';

function fetcher(url: string) {
  return axiosInstance.get(url).then((res) => res.data);
}

/** Handles auth gate: when !user show Login at / and redirect elsewhere to /; when user show layout. Logout navigates to / then clears session. */
function RootGate() {
  const { user, setSession, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate('/', { replace: true });
    logout();
  };

  if (!user) {
    if (location.pathname !== '/') return <Navigate to="/" replace />;
    return <Login onAuthSuccess={setSession} />;
  }

  return (
    <DashboardLayout
      user={user}
      onLogout={handleLogout}
      setSession={setSession}
    />
  );
}

export default function App() {
  return (
    <ConfigProvider theme={{ token: themeTokens }}>
      <SWRConfig value={{ fetcher }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootGate />}>
              <Route index element={<Navigate to={DEFAULT_ROUTE_PATH} replace />} />
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
                    <ReportsPage />
                  </RouteProtector>
                }
              />
              <Route
                path="teams"
                element={
                  <RouteProtector>
                    <TeamsPage />
                  </RouteProtector>
                }
              />
              <Route
                path="groups"
                element={
                  <RouteProtector>
                    <GroupsPage />
                  </RouteProtector>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SWRConfig>
    </ConfigProvider>
  );
}
