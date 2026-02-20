import { Modal, Descriptions, Image, Typography } from 'antd';
import type { Claim } from '../../types/claim';

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

  return (
    <Modal
      title="Claim vs AI analysis"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnClose
    >
      <Descriptions column={1} bordered size="small" className="mb-4">
        <Descriptions.Item label="Amount (submitted)">
          <Text>{claim.amount != null ? `$${Number(claim.amount).toFixed(2)}` : '—'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Amount (AI)">
          <Text type="secondary">{aiAmount === '—' ? '—' : `$${Number(aiAmount).toFixed(2)}`}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Merchant (submitted)">
          <Text>{claim.merchant || '—'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Merchant (AI)">
          <Text type="secondary">{aiVendor}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Category (submitted)">
          <Text>{claim.category || '—'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Category (AI)">
          <Text type="secondary">{aiCategory}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Expense date (submitted)">
          <Text>{claim.expenseDate || '—'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Date (AI)">
          <Text type="secondary">{aiDate}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Description (submitted)">
          <Text>{claim.description || '—'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Summary (AI)">
          <Text type="secondary">{aiSummary}</Text>
        </Descriptions.Item>
        {flags.length > 0 && (
          <Descriptions.Item label="Policy flags (AI)">
            <Text type="warning">{flags.join(', ')}</Text>
          </Descriptions.Item>
        )}
        {flagMessages.length > 0 && (
          <Descriptions.Item label="Flag messages">
            <Text type="warning">{flagMessages.join('; ')}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>
      {receiptUrl && (
        <div className="mt-4">
          <Text strong className="block mb-2">Receipt</Text>
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
