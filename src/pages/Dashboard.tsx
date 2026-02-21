import ClaimsFiltersAndTable, { type ClaimsStatusTab } from '../components/claims/ClaimsFiltersAndTable';
import type { Claim } from '../types/claim';

export type { ClaimsStatusTab };

interface DashboardProps {
  items: Claim[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  loading?: boolean;
  currentUserId?: string;
  canAct?: boolean;
  canDisburse?: boolean;
  onApprove?: (claim: Claim) => void;
  onReject?: (claim: Claim) => void;
  onSubmit?: (claim: Claim) => void;
  onDisburse?: (claim: Claim) => void;
  onNewClaim?: () => void;
  onViewComparison?: (claim: Claim) => void;
  onEditDraft?: (claim: Claim) => void;
  onDeleteDraft?: (claim: Claim) => void;
  statusTab?: ClaimsStatusTab;
  onStatusTabChange?: (tab: ClaimsStatusTab) => void;
}

export default function Dashboard({
  items,
  total,
  page,
  pageSize,
  onPageChange,
  loading,
  currentUserId,
  canAct,
  canDisburse,
  onApprove,
  onReject,
  onSubmit,
  onDisburse,
  onNewClaim,
  onViewComparison,
  onEditDraft,
  onDeleteDraft,
  statusTab = '',
  onStatusTabChange,
}: DashboardProps) {
  return (
    <ClaimsFiltersAndTable
      claims={items}
      loading={loading}
      pagination={{ page, pageSize, total, onChange: onPageChange }}
      onPageChange={onPageChange}
      currentUserId={currentUserId}
      canAct={canAct}
      canDisburse={canDisburse}
      onApprove={onApprove}
      onReject={onReject}
      onSubmit={onSubmit}
      onDisburse={onDisburse}
      onNewClaim={onNewClaim}
      onViewComparison={onViewComparison}
      onEditDraft={onEditDraft}
      onDeleteDraft={onDeleteDraft}
      statusTab={statusTab}
      onStatusTabChange={onStatusTabChange}
    />
  );
}
