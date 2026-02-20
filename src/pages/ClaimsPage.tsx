import { useState } from 'react';
import { Modal } from 'antd';
import { DEFAULT_PAGE_SIZE } from '../core-utils/types/pagination';
import { useClaims } from '../hooks/useClaims';
import { useCreateClaim, useUpdateClaimStatus } from '../hooks/useClaimsMutation';
import { usePermissions } from '../hooks/usePermissions';
import CreateClaimModal from '../components/CreateClaimModal';
import Dashboard from './Dashboard';
import type { Claim } from '../types/claim';
import type { CreateClaimRequest } from '../types/claim';

/**
 * Claims page container: owns hooks, handlers, and composes Dashboard + CreateClaimModal.
 * Used when route is /claims and user has xpensepanel:claims:view.
 */
export default function ClaimsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { items, total, isLoading, error, mutate } = useClaims(page, pageSize);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { permissions } = usePermissions();
  const { createClaim, isCreating, createError } = useCreateClaim(() => {
    mutate();
  });
  const { updateClaimStatus, isUpdating } = useUpdateClaimStatus(() => {
    mutate();
  });

  const canAct = permissions.includes('xpensepanel:claims:approve');

  const handlePageChange = (p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  };

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

  return (
    <>
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
    </>
  );
}
