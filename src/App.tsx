import { useState } from 'react';
import { ConfigProvider, Modal } from 'antd';
import { SWRConfig } from 'swr';
import { axiosInstance } from './core-utils/axiosInstance';
import { themeTokens } from './core-utils/theme';
import { DEFAULT_PAGE_SIZE } from './core-utils/types/pagination';
import { useAuth } from './hooks/useAuth';
import { useClaims } from './hooks/useClaims';
import { useCreateClaim, useUpdateClaimStatus } from './hooks/useClaimsMutation';
import Login from './Login';
import CreateClaimModal from './components/CreateClaimModal';
import DashboardLayout from './templates/DashboardLayout';
import Dashboard from './pages/Dashboard';
import type { Claim } from './types/claim';
import type { CreateClaimRequest } from './types/claim';

function fetcher(url: string) {
  return axiosInstance.get(url).then((res) => res.data);
}

interface AuthenticatedAppProps {
  onLogout: () => void;
}

function AuthenticatedApp({ onLogout }: AuthenticatedAppProps) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { items, total, isLoading, error, mutate } = useClaims(page, pageSize);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handlePageChange = (p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  };

  const { createClaim, isCreating, createError } = useCreateClaim(() => {
    mutate();
  });
  const { updateClaimStatus, isUpdating } = useUpdateClaimStatus(() => {
    mutate();
  });

  const canAct =
    user?.role === 'manager' ||
    user?.role === 'admin' ||
    user?.role === 'finance_admin';

  const handleApprove = (claim: Claim) => {
    Modal.confirm({
      title: 'Approve claim',
      content: `Approve claim for $${claim.amount}?`,
      okText: 'Approve',
      onOk: () => updateClaimStatus(claim.id, { status: 'approved' }),
    });
  };

  const handleReject = (claim: Claim) => {
    Modal.confirm({
      title: 'Reject claim',
      content: `Reject this claim?`,
      okText: 'Reject',
      okButtonProps: { danger: true },
      onOk: () => updateClaimStatus(claim.id, { status: 'rejected' }),
    });
  };

  const handleCreateSubmit = async (values: CreateClaimRequest) => {
    await createClaim(values);
  };

  if (!user) return null;

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="Claims">
      {createError && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
          Failed to create claim. Please try again.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
          Failed to load claims. Please try again.
        </div>
      )}
      <Dashboard
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        loading={isLoading || isUpdating}
        canAct={canAct}
        onApprove={handleApprove}
        onReject={handleReject}
        onNewClaim={() => setCreateModalOpen(true)}
      />
      <CreateClaimModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        loading={isCreating}
      />
    </DashboardLayout>
  );
}

export default function App() {
  const { user, setSession, logout } = useAuth();

  if (!user) {
    return <Login onAuthSuccess={setSession} />;
  }

  return (
    <ConfigProvider theme={{ token: themeTokens }}>
      <SWRConfig value={{ fetcher }}>
        <AuthenticatedApp onLogout={logout} />
      </SWRConfig>
    </ConfigProvider>
  );
}
