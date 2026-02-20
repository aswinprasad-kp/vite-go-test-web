import { ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AppTable from '../../core-utils/components/AppTable';
import type { AppTablePagination } from '../../core-utils/components/AppTable';
import type { Claim } from '../../types/claim';

const statusColor: Record<string, string> = {
  draft: 'default',
  pending: 'processing',
  submitted: 'processing',
  approved: 'success',
  rejected: 'error',
  disbursed: 'success',
};

export interface ClaimsFiltersAndTableProps {
  claims: Claim[];
  loading?: boolean;
  pagination: AppTablePagination;
  onPageChange?: (page: number, pageSize: number) => void;
  /** Current user ID (Supabase uid) for owner checks e.g. Submit draft */
  currentUserId?: string;
  onApprove?: (claim: Claim) => void;
  onReject?: (claim: Claim) => void;
  onNewClaim?: () => void;
  /** Submit draft -> pending (owner only) */
  onSubmit?: (claim: Claim) => void;
  /** Disburse or reject approved claim (finance) */
  onDisburse?: (claim: Claim) => void;
  canAct?: boolean;
  canDisburse?: boolean;
  /** Open comparison (user vs AI) + receipt view */
  onViewComparison?: (claim: Claim) => void;
}

export default function ClaimsFiltersAndTable({
  claims,
  loading,
  pagination,
  onPageChange,
  currentUserId,
  onApprove,
  onReject,
  onNewClaim,
  onSubmit,
  onDisburse,
  canAct = false,
  canDisburse = false,
  onViewComparison,
}: ClaimsFiltersAndTableProps) {
  const columns: ColumnsType<Claim> = [
    ...(canAct
      ? [
          {
            title: '',
            key: 'supervision',
            width: 44,
            align: 'center' as const,
            fixed: 'left' as const,
            render: (_: unknown, r: Claim) => {
              const s = r.needSupervision;
              if (s === 'high')
                return (
                  <Tooltip title="Needs supervision: submitted data differs significantly from AI">
                    <ExclamationCircleOutlined
                      style={{ color: '#dc2626', fontSize: 18 }}
                      className="align-middle"
                    />
                  </Tooltip>
                );
              if (s === 'low')
                return (
                  <Tooltip title="Minor differences from AI analysis">
                    <WarningOutlined
                      style={{ color: '#f59e0b', fontSize: 18 }}
                      className="align-middle"
                    />
                  </Tooltip>
                );
              return null;
            },
          },
        ]
      : []),
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 180,
      render: (_, r) => r.description || r.merchant || '—',
    },
    {
      title: 'Merchant',
      dataIndex: 'merchant',
      key: 'merchant',
      ellipsis: true,
      width: 140,
      render: (v) => v || '—',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      ellipsis: true,
      width: 100,
      render: (v) => v || '—',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 100,
      render: (v) => (v != null ? `$${Number(v).toFixed(2)}` : '—'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: string) => (
        <Tag color={statusColor[v?.toLowerCase()] ?? 'default'}>
          {(v ?? 'draft').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'expenseDate',
      key: 'date',
      width: 110,
      render: (_: unknown, r: Claim) =>
        r.expenseDate
          ? new Date(r.expenseDate).toLocaleDateString()
          : r.createdAt
            ? new Date(r.createdAt).toLocaleDateString()
            : '—',
    },
  ];

  const hasView = onViewComparison != null;
  const hasActions =
    (canAct && (onApprove || onReject)) ||
    (onSubmit !== undefined) ||
    (canDisburse && (onDisburse || onReject)) ||
    hasView;
  if (hasActions) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      width: hasView ? 240 : 200,
      fixed: 'right',
      render: (_, record) => {
        const status = record.status?.toLowerCase();
        const isOwner = currentUserId
          ? record.userId === currentUserId
          : !canAct;
        return (
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {status === 'draft' && isOwner && onSubmit && (
              <button
                type="button"
                onClick={() => onSubmit(record)}
                className="text-primary hover:underline"
              >
                Submit
              </button>
            )}
            {status === 'pending' && canAct && onApprove && (
              <button
                type="button"
                onClick={() => onApprove(record)}
                className="text-primary hover:underline"
              >
                Approve
              </button>
            )}
            {status === 'pending' && canAct && onReject && (
              <button
                type="button"
                onClick={() => onReject(record)}
                className="text-red-600 hover:underline"
              >
                Reject
              </button>
            )}
            {status === 'approved' && canDisburse && onDisburse && (
              <button
                type="button"
                onClick={() => onDisburse(record)}
                className="text-primary hover:underline"
              >
                Disburse
              </button>
            )}
            {status === 'approved' && canDisburse && onReject && (
              <button
                type="button"
                onClick={() => onReject(record)}
                className="text-red-600 hover:underline"
              >
                Reject
              </button>
            )}
            {onViewComparison && (record.aiAnalysis || record.receiptUrl) && (
              <Button type="link" size="small" onClick={() => onViewComparison(record)}>
                View
              </Button>
            )}
          </div>
        );
      },
    });
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <p className="text-sm text-slate-500">Expense claims and approvals</p>
        {onNewClaim && (
          <Button type="primary" onClick={onNewClaim} className="shadow-sm">
            New claim
          </Button>
        )}
      </div>
      <AppTable<Claim>
        rowKey="id"
        columns={columns}
        dataSource={claims}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: onPageChange,
        }}
        scrollX={980}
      />
    </div>
  );
}
