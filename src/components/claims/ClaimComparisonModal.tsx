import { Modal, Table, Image, Typography } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import type { Claim } from '../../types/claim';
import { flagCodeToDisplayLabel } from '../../core-utils/format';

const { Text } = Typography;

export interface ClaimComparisonModalProps {
  open: boolean;
  onClose: () => void;
  claim: Claim | null;
}

function isImageUrl(url: string): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes('.jpg') || u.includes('.jpeg') || u.includes('.png') || u.includes('.gif') || u.includes('.webp');
}

function formatAmount(val: string | undefined | null): string {
  if (val == null || val === '' || val === '—') return '—';
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return `$${n.toFixed(2)}`;
}

export default function ClaimComparisonModal({
  open,
  onClose,
  claim,
}: ClaimComparisonModalProps) {
  if (!claim) return null;
  const ai = claim.aiAnalysis as Record<string, unknown> | undefined;
  const aiAmount = ai?.amount != null ? String(ai.amount) : '—';
  const aiVendor = ai?.vendor != null ? String(ai.vendor) : '—';
  const aiCategory = ai?.categoryId != null ? String(ai.categoryId) : '—';
  const aiDate = ai?.date != null ? String(ai.date) : '—';
  const aiSummary = ai?.summary != null ? String(ai.summary) : '—';
  const flags = (ai?.flags as string[] | undefined) ?? [];
  const flagMessages = (ai?.flagMessages as string[] | undefined) ?? [];
  const receiptUrl = claim.receiptUrl;
  const showReceiptImage = receiptUrl && isImageUrl(receiptUrl);

  const userAmount = formatAmount(claim.amount);
  const userMerchant = claim.merchant || '—';
  const userCategory = claim.category || '—';
  const userDate = claim.expenseDate || '—';
  const userDescription = claim.description || '—';

  const policyDisplay =
    flagMessages.length > 0
      ? flagMessages.join('; ')
      : flags.length > 0
        ? flags.map(flagCodeToDisplayLabel).join('; ')
        : null;

  const rows: { field: string; user: string; ai: string }[] = [
    { field: 'Amount', user: userAmount, ai: formatAmount(aiAmount) },
    { field: 'Merchant', user: userMerchant, ai: aiVendor },
    { field: 'Category', user: userCategory, ai: aiCategory },
    { field: 'Date', user: userDate, ai: aiDate },
    { field: 'Description / Summary', user: userDescription, ai: aiSummary },
  ];
  if (policyDisplay) {
    rows.push({ field: 'Policy flags', user: '—', ai: policyDisplay });
  }
  const reimbursable = claim.reimbursableAmount;
  if (reimbursable != null && reimbursable !== '') {
    const reimbFormatted = formatAmount(reimbursable);
    rows.push({ field: 'Reimbursable amount', user: reimbFormatted, ai: reimbFormatted });
  }

  return (
    <Modal
      title="Claim vs AI analysis"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnClose
    >
      {claim.needLegalReview && (
        <div className="mb-4 flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3 text-red-800">
          <ToolOutlined style={{ fontSize: 18, color: '#dc2626' }} />
          <span className="font-medium">Legal / policy violation detected (e.g. alcohol). Review before approving.</span>
        </div>
      )}
      <Table
        dataSource={rows}
        rowKey="field"
        pagination={false}
        showHeader
        size="small"
        className="mb-4"
        columns={[
          {
            title: 'Field',
            dataIndex: 'field',
            key: 'field',
            width: 160,
            render: (t: string) => <Text type="secondary">{t}</Text>,
          },
          {
            title: 'User',
            dataIndex: 'user',
            key: 'user',
            render: (t: string, r: { field: string }) =>
              r.field === 'Policy flags' ? (
                <Text type="secondary">—</Text>
              ) : (
                <Text>{t}</Text>
              ),
          },
          {
            title: 'AI',
            dataIndex: 'ai',
            key: 'ai',
            render: (t: string, r: { field: string }) =>
              r.field === 'Policy flags' ? (
                <Text type="warning">{t}</Text>
              ) : (
                <Text type="secondary">{t}</Text>
              ),
          },
        ]}
      />
      {receiptUrl && (
        <div className="mt-4">
          <Text strong className="block mb-2">
            Receipt
          </Text>
          {showReceiptImage ? (
            <Image src={receiptUrl} alt="Receipt" style={{ maxHeight: 320 }} />
          ) : (
            <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
              Open receipt in new tab (PDF or file)
            </a>
          )}
        </div>
      )}
    </Modal>
  );
}
