import ClaimsFiltersAndTable from '../components/claims/ClaimsFiltersAndTable';
import type { Claim } from '../types/claim';

interface DashboardProps {
  items: Claim[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  loading?: boolean;
  canAct?: boolean;
  onApprove?: (claim: Claim) => void;
  onReject?: (claim: Claim) => void;
  onNewClaim?: () => void;
}

export default function Dashboard({
  items,
  total,
  page,
  pageSize,
  onPageChange,
  loading,
  canAct,
  onApprove,
  onReject,
  onNewClaim,
}: DashboardProps) {
  return (
    <ClaimsFiltersAndTable
      claims={items}
      loading={loading}
      pagination={{ page, pageSize, total, onChange: onPageChange }}
      onPageChange={onPageChange}
      canAct={canAct}
      onApprove={onApprove}
      onReject={onReject}
      onNewClaim={onNewClaim}
    />
  );
}
