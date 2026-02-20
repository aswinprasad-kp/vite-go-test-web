import { Button, Tag } from 'antd';
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
  onApprove?: (claim: Claim) => void;
  onReject?: (claim: Claim) => void;
  onNewClaim?: () => void;
  canAct?: boolean;
}

export default function ClaimsFiltersAndTable({
  claims,
  loading,
  pagination,
  onPageChange,
  onApprove,
  onReject,
  onNewClaim,
  canAct = false,
}: ClaimsFiltersAndTableProps) {
  const columns: ColumnsType<Claim> = [
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
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : '—'),
    },
  ];

  if (canAct && (onApprove || onReject)) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <div className="flex gap-2">
          {record.status?.toLowerCase() === 'pending' && onApprove && (
            <button
              type="button"
              onClick={() => onApprove(record)}
              className="text-primary hover:underline"
            >
              Approve
            </button>
          )}
          {record.status?.toLowerCase() === 'pending' && onReject && (
            <button
              type="button"
              onClick={() => onReject(record)}
              className="text-red-600 hover:underline"
            >
              Reject
            </button>
          )}
        </div>
      ),
    });
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-end">
        {onNewClaim && (
          <Button type="primary" onClick={onNewClaim}>
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
        scrollX={920}
      />
    </div>
  );
}
