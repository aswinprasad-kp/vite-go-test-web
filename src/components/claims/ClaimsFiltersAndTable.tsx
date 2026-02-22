import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  SendOutlined,
  ToolOutlined,
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
  /** Edit draft (owner only) */
  onEditDraft?: (claim: Claim) => void;
  /** Delete draft (owner only) */
  onDeleteDraft?: (claim: Claim) => void;
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
  onEditDraft,
  onDeleteDraft,
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
              if (r.needLegalReview)
                return (
                  <Tooltip title="Legal / policy violation (e.g. alcohol detected)">
                    <ToolOutlined
                      style={{ color: '#dc2626', fontSize: 18 }}
                      className="align-middle"
                    />
                  </Tooltip>
                );
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
      title: 'Type',
      key: 'claimType',
      width: 88,
      render: (_: unknown, r: Claim) => {
        if (r.teamId) return <Tag color="blue">Team</Tag>;
        if (r.groupId) return <Tag color="green">Group</Tag>;
        return <Tag>Personal</Tag>;
      },
    },
    {
      title: 'Who filed',
      key: 'submitter',
      ellipsis: true,
      width: 160,
      render: (_: unknown, r: Claim) =>
        r.submitterDisplayName?.trim() || r.submitterEmail?.trim()
          ? [r.submitterDisplayName?.trim(), r.submitterEmail?.trim()].filter(Boolean).join(' · ')
          : r.userId
            ? `User ${r.userId.slice(0, 8)}…`
            : '—',
    },
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
  const hasDraftActions = (onEditDraft != null || onDeleteDraft != null);
  const hasActions =
    (canAct && (onApprove || onReject)) ||
    (onSubmit !== undefined) ||
    (canDisburse && (onDisburse || onReject)) ||
    hasView ||
    hasDraftActions;
  if (hasActions) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      width: hasView ? 160 : 180,
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
        if (status === 'draft' && isOwner && onEditDraft) {
          buttons.push(
            <Tooltip key="edit" title="Edit draft">
              <Button size="small" icon={<EditOutlined />} onClick={() => onEditDraft(record)} />
            </Tooltip>
          );
        }
        if (status === 'draft' && isOwner && onDeleteDraft) {
          buttons.push(
            <Tooltip key="delete" title="Delete draft">
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDeleteDraft(record)} />
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
