import { Image, Modal, Typography } from 'antd';
import { ToolOutlined, WarningOutlined } from '@ant-design/icons';
import type { Claim } from '../../types/claim';
import { flagCodeToDisplayLabel } from '../../core-utils/format';
import { useClaim } from '../../hooks/useClaims';
import { useTeams } from '../../hooks/useTeams';
import { useGroups } from '../../hooks/useGroups';
import AppTable from '../../core-utils/components/AppTable';

const { Text } = Typography;

function toTitleCase(s: string): string {
  if (!s || s === '—') return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

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

const claimColumns = [
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
    render: (t: string) => <Text>{t}</Text>,
  },
  {
    title: 'AI',
    dataIndex: 'ai',
    key: 'ai',
    render: (t: string) => <Text type="secondary">{t}</Text>,
  },
];

export default function ClaimComparisonModal({
  open,
  onClose,
  claim: claimFromList,
}: ClaimComparisonModalProps) {
  const { claim: fetchedClaim, isLoading } = useClaim(open && claimFromList ? claimFromList.id : null);
  const claim = (fetchedClaim ?? claimFromList) as Claim | null;
  const { teams } = useTeams();
  const { groups } = useGroups();

  if (!claim) return null;

  const team = claim.teamId ? teams.find((t) => t.id === claim.teamId) : null;
  const group = claim.groupId ? groups.find((g) => g.id === claim.groupId) : null;
  const teamName = team?.name ?? (claim.teamId ? `Team (${claim.teamId.slice(0, 8)}…)` : '—');
  const groupName = group?.name ?? (claim.groupId ? `Group (${claim.groupId.slice(0, 8)}…)` : '—');

  const ai = claim.aiAnalysis as Record<string, unknown> | undefined;
  const aiAmount = ai?.amount != null ? String(ai.amount) : '—';
  const aiVendor = ai?.vendor != null ? String(ai.vendor) : '—';
  const aiCategoryRaw = ai?.categoryId != null ? String(ai.categoryId) : '—';
  const aiCategory = aiCategoryRaw !== '—' ? toTitleCase(aiCategoryRaw) : '—';
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

  const claimantDisplay =
    claim.submitterDisplayName?.trim() || claim.submitterEmail?.trim()
      ? [claim.submitterDisplayName?.trim(), claim.submitterEmail?.trim()].filter(Boolean).join(' · ')
      : claim.userId
        ? `User ID: ${claim.userId.slice(0, 8)}…`
        : '—';

  // Core claim details only (no policy, no team/group; Who filed is shown separately)
  const claimRows: { field: string; user: string; ai: string }[] = [
    { field: 'Amount', user: userAmount, ai: formatAmount(aiAmount) },
    { field: 'Merchant', user: userMerchant, ai: aiVendor },
    { field: 'Category', user: userCategory, ai: aiCategory },
    { field: 'Date', user: userDate, ai: aiDate },
    { field: 'Description / Summary', user: userDescription, ai: aiSummary },
  ];
  const reimbursable = claim.reimbursableAmount;
  if (reimbursable != null && reimbursable !== '') {
    const reimbFormatted = formatAmount(reimbursable);
    claimRows.push({ field: 'Reimbursable amount', user: reimbFormatted, ai: reimbFormatted });
  }

  // Team details (optional, separate table)
  const teamRows: { field: string; value: string }[] = [];
  if (claim.teamId) {
    teamRows.push({ field: 'Team', value: teamName });
    if (claim.reimburseToUserId) {
      const reimburseToDisplay =
        claim.reimburseToUserDisplayName?.trim() || claim.reimburseToUserEmail?.trim()
          ? [claim.reimburseToUserDisplayName?.trim(), claim.reimburseToUserEmail?.trim()].filter(Boolean).join(' · ')
          : claim.reimburseToUserId.slice(0, 8) + '…';
      teamRows.push({ field: 'Reimburse to', value: `${reimburseToDisplay} · ${userAmount}` });
    }
  }

  // Group details (optional, separate table)
  const groupRows: { field: string; value: string }[] = [];
  if (claim.groupId) {
    groupRows.push({ field: 'Group', value: groupName });
    if (claim.reimbursementRecipients && claim.reimbursementRecipients.length > 0) {
      const breakdown = claim.reimbursementRecipients
        .map((r) => {
          const who =
            r.displayName?.trim() || r.email?.trim()
              ? [r.displayName?.trim(), r.email?.trim()].filter(Boolean).join(' · ')
              : r.userId.slice(0, 8) + '…';
          return `${who}: ${formatAmount(r.amount)}`;
        })
        .join('; ');
      groupRows.push({ field: 'Split (each person · amount)', value: breakdown });
    } else {
      groupRows.push({ field: 'Reimbursement', value: `Full amount to submitter · ${userAmount}` });
    }
  }

  // Ad-hoc split (recipients without groupId/teamId)
  const isAdHocSplit = claim.reimbursementRecipients?.length && !claim.groupId && !claim.teamId;
  if (isAdHocSplit && claim.reimbursementRecipients) {
    const breakdown = claim.reimbursementRecipients
      .map((r) => {
        const who =
          r.displayName?.trim() || r.email?.trim()
            ? [r.displayName?.trim(), r.email?.trim()].filter(Boolean).join(' · ')
            : r.userId.slice(0, 8) + '…';
        return `${who}: ${formatAmount(r.amount)}`;
      })
      .join('; ');
    groupRows.push({ field: 'Split (each person · amount)', value: breakdown });
  }
  const groupSectionTitle = claim.groupId ? 'Group details' : isAdHocSplit ? 'Split details' : 'Group details';

  const smallTableColumns = [
    { title: 'Field', dataIndex: 'field', key: 'field', width: 160, render: (t: string) => <Text type="secondary">{t}</Text> },
    { title: 'Value', dataIndex: 'value', key: 'value', render: (t: string) => <Text>{t}</Text> },
  ];

  return (
    <Modal
      title="Claim vs AI analysis"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnClose
      styles={{ body: { maxHeight: '85vh', overflowY: 'auto' } }}
    >
      {claim.needLegalReview && (
        <div className="mb-4 flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3 text-red-800">
          <ToolOutlined style={{ fontSize: 18, color: '#dc2626' }} />
          <span className="font-medium">Legal / policy violation detected (e.g. alcohol). Review before approving.</span>
        </div>
      )}
      {isLoading && (
        <p className="mb-2 text-sm text-slate-500">Loading claimant details…</p>
      )}

      {/* Who filed – separate from claim details */}
      <div className="mb-3 rounded border border-slate-200 bg-slate-50/60 px-3 py-2">
        <Text type="secondary" className="text-xs uppercase tracking-wide">Who filed</Text>
        <div className="mt-0.5">
          <Text strong>{claimantDisplay}</Text>
        </div>
      </div>

      {/* Core claim details */}
      <div className="mb-1">
        <Text strong className="text-slate-700">Claim details</Text>
      </div>
      <AppTable
        dataSource={claimRows}
        rowKey="field"
        pagination={false}
        size="small"
        className="mb-4"
        scrollX={420}
        columns={claimColumns}
      />

      {/* Policy flags – separate section (AI-only, never from user) */}
      {policyDisplay && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <WarningOutlined style={{ color: 'var(--xpense-warning)' }} />
            <Text strong className="text-amber-800">Policy flags</Text>
          </div>
          <Text type="warning" className="block text-sm text-amber-800">
            {policyDisplay}
          </Text>
        </div>
      )}

      {/* Team details – optional, separate table */}
      {teamRows.length > 0 && (
        <div className="mb-4">
          <div className="mb-1">
            <Text strong className="text-slate-700">Team details</Text>
          </div>
          <AppTable
            dataSource={teamRows}
            rowKey="field"
            pagination={false}
            size="small"
            className="mb-0"
            scrollX={420}
            columns={smallTableColumns}
          />
        </div>
      )}

      {/* Group / split details – optional, separate table */}
      {groupRows.length > 0 && (
        <div className="mb-4">
          <div className="mb-1">
            <Text strong className="text-slate-700">{groupSectionTitle}</Text>
          </div>
          <AppTable
            dataSource={groupRows}
            rowKey="field"
            pagination={false}
            size="small"
            className="mb-0"
            scrollX={420}
            columns={smallTableColumns}
          />
        </div>
      )}

      {/* Receipt – full card width, bottom fade */}
      {receiptUrl && (
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50/50" style={{ background: 'var(--xpense-bg)' }}>
          <Text strong className="mb-2 block px-3 pt-3 text-slate-700">
            Receipt
          </Text>
          <div className="relative w-full">
            {showReceiptImage ? (
              <>
                <div className="relative w-full overflow-hidden rounded-b-lg" style={{ maxHeight: 400 }}>
                  <Image
                    src={receiptUrl}
                    alt="Receipt"
                    rootClassName="block w-full"
                    style={{ maxHeight: 400, width: '100%', objectFit: 'contain', objectPosition: 'top center' }}
                    preview={{
                      mask: 'View full receipt',
                      imageRender: (originalNode) => originalNode,
                    }}
                  />
                  {/* Bottom fade with card background */}
                  <div
                    className="pointer-events-none absolute bottom-0 left-0 right-0 h-16"
                    style={{
                      background: `linear-gradient(to bottom, transparent 0%, var(--xpense-bg-card) 100%)`,
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="px-3 pb-3">
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Open receipt in new tab (PDF or file)
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
