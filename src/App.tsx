import { ConfigProvider } from 'antd';
import { SWRConfig } from 'swr';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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

  return <DashboardLayout user={user} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <ConfigProvider theme={{ token: themeTokens }}>
      <SWRConfig value={{ fetcher }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootGate />}>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SWRConfig>
    </ConfigProvider>
  );
}
