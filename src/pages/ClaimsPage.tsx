import { useState } from 'react';
import { Input, Modal } from 'antd';
import { DEFAULT_PAGE_SIZE } from '../core-utils/types/pagination';
import { useAuth } from '../hooks/useAuth';
import { useClaims } from '../hooks/useClaims';
import { useUpdateClaimStatus } from '../hooks/useClaimsMutation';
import { usePermissions } from '../hooks/usePermissions';
import ClaimComparisonModal from '../components/claims/ClaimComparisonModal';
import CreateClaimModal from '../components/CreateClaimModal';
import Dashboard from './Dashboard';
import type { Claim } from '../types/claim';

/**
 * Claims page container: owns hooks, handlers, and composes Dashboard + CreateClaimModal.
 * Used when route is /claims and user has xpensepanel:claims:view.
 */
export default function ClaimsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { items, total, isLoading, error, mutate } = useClaims(page, pageSize);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [comparisonClaim, setComparisonClaim] = useState<Claim | null>(null);
  const [approveModal, setApproveModal] = useState<{ claim: Claim; reason: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ claim: Claim; reason: string } | null>(null);

  const { permissions } = usePermissions();
  const { updateClaimStatus, isUpdating } = useUpdateClaimStatus(() => mutate());

  const canAct =
    permissions.includes('xpensepanel:claims:approve') ||
    permissions.includes('xpense:claims:approve');
  const canDisburse =
    permissions.includes('xpensepanel:claims:disburse') ||
    permissions.includes('xpense:claims:disburse');
  const currentUserId = user?.uid;

  const handlePageChange = (p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  };

  const needsReasonForApprove = (c: Claim) => c.needSupervision === 'high';

  const handleApprove = (claim: Claim) => {
    setApproveModal({ claim, reason: '' });
  };

  const handleApproveOk = async () => {
    if (!approveModal) return;
    const { claim, reason } = approveModal;
    if (needsReasonForApprove(claim) && !reason.trim()) {
      return; // block submit; user must enter reason
    }
    await updateClaimStatus(claim.id, { status: 'approved', reason: reason.trim() || undefined });
    setApproveModal(null);
  };

  const handleSubmit = (claim: Claim) => {
    Modal.confirm({
      title: 'Submit claim',
      content: `Submit this claim for approval?`,
      okText: 'Submit',
      onOk: () => updateClaimStatus(claim.id, { status: 'pending' }),
    });
  };

  const handleReject = (claim: Claim) => {
    setRejectModal({ claim, reason: '' });
  };

  const handleRejectOk = async () => {
    if (!rejectModal) return;
    const { claim, reason } = rejectModal;
    if (!reason.trim()) return; // mandatory reason for reject
    await updateClaimStatus(claim.id, { status: 'rejected', reason: reason.trim() });
    setRejectModal(null);
  };

  const handleDisburse = (claim: Claim) => {
    Modal.confirm({
      title: 'Mark as disbursed',
      content: `Mark claim for $${claim.amount} as disbursed?`,
      okText: 'Disburse',
      onOk: () => updateClaimStatus(claim.id, { status: 'disbursed' }),
    });
  };

  return (
    <>
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
        currentUserId={currentUserId}
        canAct={canAct}
        canDisburse={canDisburse}
        onApprove={handleApprove}
        onReject={handleReject}
        onSubmit={handleSubmit}
        onDisburse={handleDisburse}
        onNewClaim={() => setCreateModalOpen(true)}
        onViewComparison={(c) => setComparisonClaim(c)}
      />
      <ClaimComparisonModal
        open={comparisonClaim != null}
        onClose={() => setComparisonClaim(null)}
        claim={comparisonClaim}
      />
      <Modal
        title="Approve claim"
        open={approveModal != null}
        onCancel={() => setApproveModal(null)}
        onOk={handleApproveOk}
        okText="Approve"
        okButtonProps={{
          disabled: approveModal != null && needsReasonForApprove(approveModal.claim) && !approveModal.reason.trim(),
        }}
        destroyOnClose
      >
        <p className="mb-2">
          Approve claim for ${approveModal?.claim?.amount ?? '—'}?
          {approveModal && needsReasonForApprove(approveModal.claim) && (
            <span className="block mt-2 text-amber-600">Reason is required (data differs significantly from AI).</span>
          )}
        </p>
        <div className="mb-0">
          <label className="block text-sm text-slate-600 mb-1">Reason {approveModal && needsReasonForApprove(approveModal.claim) ? '(required)' : '(optional)'}</label>
          <Input.TextArea
            rows={3}
            value={approveModal?.reason ?? ''}
            onChange={(e) => setApproveModal((prev) => (prev ? { ...prev, reason: e.target.value } : null))}
            placeholder={approveModal && needsReasonForApprove(approveModal.claim) ? 'Required for this claim' : 'Optional comment'}
          />
        </div>
      </Modal>
      <Modal
        title="Reject claim"
        open={rejectModal != null}
        onCancel={() => setRejectModal(null)}
        onOk={handleRejectOk}
        okText="Reject"
        okButtonProps={{
          danger: true,
          disabled: rejectModal != null && !rejectModal.reason.trim(),
        }}
        destroyOnClose
      >
        <p className="mb-2">Reject this claim? A reason is required.</p>
        <div className="mb-0">
          <label className="block text-sm text-slate-600 mb-1">Reason (required)</label>
          <Input.TextArea
            rows={3}
            value={rejectModal?.reason ?? ''}
            onChange={(e) => setRejectModal((prev) => (prev ? { ...prev, reason: e.target.value } : null))}
            placeholder="Enter rejection reason"
          />
        </div>
      </Modal>
      <CreateClaimModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => mutate()}
      />
    </>
  );
}
