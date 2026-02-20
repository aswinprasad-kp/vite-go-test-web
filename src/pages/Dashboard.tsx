import ClaimsFiltersAndTable from '../components/claims/ClaimsFiltersAndTable';
import type { Claim } from '../types/claim';

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
    />
  );
}
