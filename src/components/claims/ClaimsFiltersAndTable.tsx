import {
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  SendOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Space, Tabs, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import AppTable from '../../core-utils/components/AppTable';
import type { AppTablePagination } from '../../core-utils/components/AppTable';
import type { Claim } from '../../types/claim';

export type ClaimsStatusTab = '' | 'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'disbursed';

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
  /** Active status filter tab (sent as API param) */
  statusTab?: ClaimsStatusTab;
  onStatusTabChange?: (tab: ClaimsStatusTab) => void;
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
  statusTab = '',
  onStatusTabChange,
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
      width: hasView ? 140 : 100,
      fixed: 'right',
      align: 'right',
      render: (_, record) => {
        const status = record.status?.toLowerCase();
        const isOwner = currentUserId
          ? record.userId === currentUserId
          : !canAct;
        const buttons: React.ReactNode[] = [];
        if (status === 'draft' && isOwner && onSubmit) {
          buttons.push(
            <Tooltip key="submit" title="Submit for approval">
              <Button type="primary" size="small" icon={<SendOutlined />} onClick={() => onSubmit(record)} />
            </Tooltip>
          );
        }
        if (status === 'pending' && canAct && onApprove) {
          buttons.push(
            <Tooltip key="approve" title="Approve">
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => onApprove(record)} />
            </Tooltip>
          );
        }
        if (status === 'pending' && canAct && onReject) {
          buttons.push(
            <Tooltip key="reject-pending" title="Reject">
              <Button danger size="small" icon={<CloseOutlined />} onClick={() => onReject(record)} />
            </Tooltip>
          );
        }
        if (status === 'approved' && canDisburse && onDisburse) {
          buttons.push(
            <Tooltip key="disburse" title="Mark disbursed">
              <Button type="primary" size="small" icon={<DollarOutlined />} onClick={() => onDisburse(record)} />
            </Tooltip>
          );
        }
        if (status === 'approved' && canDisburse && onReject) {
          buttons.push(
            <Tooltip key="reject-approved" title="Reject">
              <Button danger size="small" icon={<CloseOutlined />} onClick={() => onReject(record)} />
            </Tooltip>
          );
        }
        if (onViewComparison && (record.aiAnalysis || record.receiptUrl)) {
          buttons.push(
            <Tooltip key="view" title="View details & receipt">
              <Button size="small" icon={<EyeOutlined />} onClick={() => onViewComparison(record)} />
            </Tooltip>
          );
        }
        return (
          <Space size="small" wrap={false} className="flex justify-end">
            {buttons}
          </Space>
        );
      },
    });
  }

  const statusTabs: { key: ClaimsStatusTab; label: string }[] = [
    { key: '', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'disbursed', label: 'Disbursed' },
  ];

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-500">Expense claims and approvals</p>
          {onStatusTabChange && (
            <Tabs
              activeKey={statusTab === 'all' ? '' : statusTab}
              onChange={(k) => onStatusTabChange((k || '') as ClaimsStatusTab)}
              size="small"
              items={statusTabs.map((t) => ({ key: t.key, label: t.label }))}
            />
          )}
        </div>
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
