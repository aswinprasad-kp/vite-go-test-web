import { useState, useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { Alert, Button, DatePicker, Form, Input, InputNumber, message, Modal, Radio, Select, Space, Spin, Steps } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, MinusCircleOutlined, TeamOutlined, UserAddOutlined, UploadOutlined } from '@ant-design/icons';
import {
  useCreateClaim,
  useGetClaim,
  useUpdateClaimDraft,
} from '../hooks/useClaimsMutation';
import { useUploadReceiptForClaim } from '../hooks/useReceiptUpload';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { useTeams } from '../hooks/useTeams';
import { useGroupMembers } from '../hooks/useGroups';
import { useTeamMembers } from '../hooks/useTeams';
import type { CreateClaimRequest, UpdateClaimDraftRequest } from '../types/claim';

/** Form values: expenseDate is Dayjs from DatePicker; API expects string. */
type CreateClaimFormValues = Omit<CreateClaimRequest, 'expenseDate'> & {
  amountNum?: number;
  expenseDate?: Dayjs;
  claimFor?: 'personal' | 'group' | 'team';
  groupReimburseMode?: 'full_to_me' | 'split';
  splitRecipients?: { userId: string; amount: number }[];
  softwareReimburseOption?: 'cap_only' | 'full_deduct_next_month';
};

interface CreateClaimModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MEALS_CAP = 200;
const SOFTWARE_MONTHLY_CAP_USD = 20;

const categoryOptions = ['Meals', 'Travel', 'Supplies', 'Software', 'AI Purchase', 'Other'];
const categoryMap: Record<string, string> = {
  meals: 'Meals',
  travel: 'Travel',
  supplies: 'Supplies',
  software: 'Software',
  'ai purchase': 'AI Purchase',
  other: 'Other',
};
function toFormCategory(categoryId?: string) {
  if (!categoryId) return 'Other';
  const c = categoryMap[categoryId.toLowerCase()];
  return c || (categoryOptions.includes(categoryId) ? categoryId : 'Other');
}

const EMPTY_DRAFT: CreateClaimRequest = {
  amount: '0',
  merchant: '',
  category: 'Other',
  description: '',
};

export default function CreateClaimModal({
  open,
  onClose,
  onSuccess,
}: CreateClaimModalProps) {
  const [form] = Form.useForm<CreateClaimFormValues>();
  const [receiptFile, setReceiptFile] = useState<File | undefined>();
  const [draftId, setDraftId] = useState<string | null>(null);
  /** Step-by-step: type (Personal/Group/Team + details) -> upload (receipt) -> uploading (AI) -> review (edit & submit) */
  const [flowStep, setFlowStep] = useState<'type' | 'upload' | 'uploading' | 'review'>('type');
  const [stopPolling, setStopPolling] = useState(false);
  const [selectFromGroupOpen, setSelectFromGroupOpen] = useState(false);
  const [selectFromGroupSelected, setSelectFromGroupSelected] = useState<string[]>([]);
  /** Claim type sent when we created the draft; used on submit so we don't lose Group/Team after prefill or form reset */
  const createdClaimTypeRef = useRef<Partial<CreateClaimRequest>>(null);
  /** Captured when clicking Next from step 1 so Upload step shows correct type (form fields are unmounted there) */
  const [step1ClaimTypeSummary, setStep1ClaimTypeSummary] = useState<{
    claimFor: 'personal' | 'group' | 'team';
    groupId?: string;
    teamId?: string;
    groupName?: string;
    teamName?: string;
    groupReimburseMode?: 'full_to_me' | 'split';
    splitMode?: 'auto' | 'manual';
    splitRecipients?: { userId: string; amount: number }[];
    reimburseToUserId?: string;
  } | null>(null);
  /** When group split: 'auto' = equal split after AI; 'manual' = user enters amounts (step 1 only) */
  const [splitMode, setSplitMode] = useState<'auto' | 'manual'>('auto');

  const category = Form.useWatch('category', form) ?? 'Other';
  const amountNum = Form.useWatch('amountNum', form) ?? 0;
  const claimFor = Form.useWatch('claimFor', form) ?? 'personal';
  const groupId = Form.useWatch('groupId', form);
  const teamId = Form.useWatch('teamId', form);
  const groupReimburseMode = Form.useWatch('groupReimburseMode', form) ?? 'full_to_me';
  const showMealsCapWarning = category === 'Meals' && Number(amountNum) > MEALS_CAP;
  const showSoftwareOption = category === 'Software' || category === 'AI Purchase';

  const { user } = useAuth();
  const { groups } = useGroups();
  const { teams } = useTeams();
  // On Upload step, form type fields are unmounted – use step1ClaimTypeSummary so we still load group/team members for draft creation
  const groupIdForMembers =
    flowStep === 'upload' && step1ClaimTypeSummary?.claimFor === 'group'
      ? step1ClaimTypeSummary.groupId
      : claimFor === 'group'
        ? groupId
        : null;
  const teamIdForMembers =
    flowStep === 'upload' && step1ClaimTypeSummary?.claimFor === 'team'
      ? step1ClaimTypeSummary.teamId
      : claimFor === 'team'
        ? teamId
        : null;
  const { members: groupMembers } = useGroupMembers(groupIdForMembers ?? null);
  const { members: teamMembers } = useTeamMembers(teamIdForMembers ?? null);

  const teamsILead = useMemo(() => teams.filter((t) => t.leaderId === user?.uid), [teams, user?.uid]);
  const acceptedGroupMembers = useMemo(
    () => groupMembers.filter((m) => m.status === 'accepted'),
    [groupMembers]
  );
  const teamReimburseOptions = useMemo(() => {
    if (!teamId || !teams.length) return [];
    const team = teams.find((t) => t.id === teamId);
    if (!team) return [];
    const opts: { value: string; label: string }[] = [];
    if (team.leaderId === user?.uid) opts.push({ value: team.leaderId, label: 'Me (Team leader)' });
    else opts.push({ value: team.leaderId, label: 'Team leader' });
    teamMembers.forEach((m) => {
      if (m.userId !== team.leaderId) opts.push({ value: m.userId, label: m.email ?? m.userId });
    });
    return opts;
  }, [teamId, teams, teamMembers, user?.uid]);

  const { createClaim, isCreating } = useCreateClaim(onSuccess);
  const { uploadReceipt } = useUploadReceiptForClaim();
  const { updateClaimDraft, isUpdatingDraft } = useUpdateClaimDraft(onSuccess);
  const { claim } = useGetClaim(
    flowStep === 'uploading' || flowStep === 'review' ? draftId : null,
    flowStep === 'uploading' && !stopPolling ? { refreshInterval: 2000 } : undefined
  );

  const aiError = claim?.aiAnalysis && '_aiError' in claim.aiAnalysis ? (claim.aiAnalysis as { _aiError: { status: number; message: string } })._aiError : undefined;

  // When switching to Personal, clear group/team fields so they're never sent
  useEffect(() => {
    if (claimFor === 'personal') {
      form.setFieldsValue({
        groupId: undefined,
        teamId: undefined,
        reimburseToUserId: undefined,
        splitRecipients: [],
      });
    }
  }, [claimFor, form]);

  // When AI failed (503, 429, etc.), stop polling and allow manual fill
  useEffect(() => {
    if (aiError) {
      setStopPolling(true);
      setFlowStep('review');
    }
  }, [aiError]);

  // When AI fill is ready, pre-fill form and move to review (ignore when _aiError is present)
  useEffect(() => {
    if (flowStep !== 'uploading' || !claim || aiError) return;
    const hasAi = claim.aiAnalysis != null && Object.keys(claim.aiAnalysis).length > 0 && !('_aiError' in claim.aiAnalysis);
    if (hasAi) {
      const amount = claim.amount ? parseFloat(claim.amount) : undefined;
      const updates: Partial<CreateClaimFormValues> = {
        amountNum: amount,
        merchant: claim.merchant ?? '',
        category: toFormCategory(claim.category),
        description: claim.description ?? '',
        expenseDate: claim.expenseDate ? dayjs(claim.expenseDate) : undefined,
      };
      if (claim.groupId && claim.reimbursementRecipients?.length) {
        const recs = claim.reimbursementRecipients.map((r) => ({
          userId: r.userId,
          amount: parseFloat(r.amount) || 0,
        }));
        const sum = recs.reduce((s, r) => s + r.amount, 0);
        const totalAmount = amount ?? 0;
        if (recs.length > 0 && sum < 0.01 && totalAmount > 0) {
          const perPerson = Number((totalAmount / recs.length).toFixed(2));
          updates.splitRecipients = recs.map((r) => ({ userId: r.userId, amount: perPerson }));
        } else {
          updates.splitRecipients = recs;
        }
      }
      form.setFieldsValue(updates);
      setFlowStep('review');
    }
  }, [flowStep, claim, form, aiError]);

  // Hydrate claim-type ref from fetched claim so submit includes group/team even after refresh or when opening draft from list
  useEffect(() => {
    if (!claim || (createdClaimTypeRef.current != null)) return;
    if (claim.groupId || claim.teamId || (claim.reimbursementRecipients?.length ?? 0) > 0) {
      createdClaimTypeRef.current = {
        groupId: claim.groupId,
        teamId: claim.teamId,
        reimburseToUserId: claim.reimburseToUserId,
        reimbursementRecipients: claim.reimbursementRecipients,
      };
    }
  }, [claim]);

  const buildGroupTeamPayload = (
    vals: CreateClaimFormValues,
    amountStr: string,
    acceptedMemberIds: string[]
  ): Partial<CreateClaimRequest> => {
    const out: Partial<CreateClaimRequest> = {};
    // Derive from actual fields so we don't lose type if claimFor was reset (e.g. after prefill)
    const asGroup = (vals.claimFor === 'group' && vals.groupId) || vals.groupId;
    const asTeam = (vals.claimFor === 'team' && vals.teamId) || vals.teamId;
    if (asGroup && vals.groupId) {
      if ((vals.groupReimburseMode ?? 'full_to_me') === 'full_to_me' && user?.uid) {
        out.groupId = vals.groupId;
        out.reimbursementRecipients = [{ userId: user.uid, amount: amountStr }];
      } else if (vals.splitRecipients?.length) {
        out.reimbursementRecipients = vals.splitRecipients.map((r) => ({
          userId: r.userId,
          amount: String(r.amount ?? 0),
        }));
        const recipientIds = new Set(out.reimbursementRecipients!.map((r) => r.userId));
        const groupMemberIds = new Set(acceptedMemberIds);
        if (groupMemberIds.size === recipientIds.size && [...groupMemberIds].every((id) => recipientIds.has(id))) {
          out.groupId = vals.groupId;
        }
      }
    }
    if (asTeam && vals.teamId) {
      out.teamId = vals.teamId;
      if (vals.reimburseToUserId) out.reimburseToUserId = vals.reimburseToUserId;
    }
    return out;
  };

  const handleOk = async () => {
    try {
      const values = form.getFieldsValue(true) as CreateClaimFormValues;
      const amount = values.amountNum ?? values.amount ?? 0;
      const amountStr = typeof amount === 'number' ? amount.toFixed(2) : String(amount ?? 0);
      const expenseDateVal = values.expenseDate as Dayjs | undefined;
      const expenseDateStr = expenseDateVal ? expenseDateVal.format('YYYY-MM-DD') : undefined;

      // Step 1: Choose type – validate and go to upload
      if (flowStep === 'type') {
        const fieldsToValidate: (keyof CreateClaimFormValues)[] = [];
        if (values.claimFor === 'group') {
          fieldsToValidate.push('groupId');
          if (values.groupReimburseMode === 'split') {
            const recs = values.splitRecipients ?? [];
            if (!recs.length) {
              message.error('Add at least one recipient for split reimbursement.');
              throw new Error('validation');
            }
          }
        }
        if (values.claimFor === 'team') {
          fieldsToValidate.push('teamId', 'reimburseToUserId');
        }
        if (fieldsToValidate.length > 0) {
          await form.validateFields(fieldsToValidate).catch(() => {
            message.error('Please fill required fields (e.g. group/team if selected).');
            throw new Error('validation');
          });
        }
        // Capture claim type for Upload step display and draft creation (form type fields are unmounted on upload step)
        const group = values.claimFor === 'group' && values.groupId ? groups.find((g) => g.id === values.groupId) : null;
        const team = values.claimFor === 'team' && values.teamId ? teams.find((t) => t.id === values.teamId) : null;
        setStep1ClaimTypeSummary({
          claimFor: values.claimFor ?? 'personal',
          groupId: values.groupId,
          teamId: values.teamId,
          groupName: group?.name,
          teamName: team?.name,
          groupReimburseMode: values.groupReimburseMode ?? 'full_to_me',
          splitMode,
          splitRecipients: values.splitRecipients,
          reimburseToUserId: values.reimburseToUserId,
        });
        setFlowStep('upload');
        return;
      }

      // Step 2: Upload – create draft WITH type from step 1 (use step1ClaimTypeSummary so type is correct)
      if (flowStep === 'upload' && receiptFile) {
        const valsForType = step1ClaimTypeSummary
          ? {
              ...values,
              claimFor: step1ClaimTypeSummary.claimFor,
              groupId: step1ClaimTypeSummary.groupId,
              teamId: step1ClaimTypeSummary.teamId,
              groupReimburseMode: step1ClaimTypeSummary.groupReimburseMode ?? 'full_to_me',
              splitRecipients: step1ClaimTypeSummary.splitRecipients ?? values.splitRecipients,
              reimburseToUserId: step1ClaimTypeSummary.reimburseToUserId,
            }
          : values;
        const groupTeam = buildGroupTeamPayload(valsForType, '0', acceptedGroupMembers.map((m) => m.userId));
        const base: CreateClaimRequest = {
          ...EMPTY_DRAFT,
          ...(groupTeam.groupId || groupTeam.teamId ? groupTeam : {}),
        };
        if (base.groupId && user?.uid && !base.reimbursementRecipients?.length) {
          base.reimbursementRecipients = [{ userId: user.uid, amount: '0' }];
        }
        const newClaim = await createClaim(base);
        if (!newClaim?.id) return;
        createdClaimTypeRef.current = {
          groupId: base.groupId,
          teamId: base.teamId,
          reimburseToUserId: base.reimburseToUserId,
          reimbursementRecipients: base.reimbursementRecipients,
        };
        setDraftId(newClaim.id);
        setFlowStep('uploading');
        await uploadReceipt(newClaim.id, receiptFile);
        setReceiptFile(undefined);
        return;
      }

      // Step 4: Review – submit for approval
      if (draftId && flowStep === 'review') {
        await form.validateFields().catch(() => {
          message.error('Please fill required fields before submitting.');
          throw new Error('validation');
        });
        const acceptedIds = acceptedGroupMembers.map((m) => m.userId);
        const fromClaim =
          claim && (claim.groupId || claim.teamId || (claim.reimbursementRecipients?.length ?? 0) > 0)
            ? {
                groupId: claim.groupId,
                teamId: claim.teamId,
                reimburseToUserId: claim.reimburseToUserId,
                reimbursementRecipients: claim.reimbursementRecipients,
              }
            : null;
        let groupTeam =
          fromClaim ??
          createdClaimTypeRef.current ??
          buildGroupTeamPayload(values, amountStr, acceptedIds);
        const recs = groupTeam.reimbursementRecipients;
        if (recs?.length) {
          if (recs.length === 1 && recs[0].userId === user?.uid) {
            groupTeam = { ...groupTeam, reimbursementRecipients: [{ userId: user.uid, amount: amountStr }] };
          } else {
            const totalAmount = Number(amountStr);
            const currentSum = recs.reduce((s, r) => s + Number(r.amount || 0), 0);
            const sumMatches = Math.abs(currentSum - totalAmount) < 0.02;
            if (sumMatches && currentSum > 0) {
              // Persist user-entered or BE-returned split amounts (manual or edited on review)
              groupTeam = {
                ...groupTeam,
                reimbursementRecipients: recs.map((r) => ({ userId: r.userId, amount: String(r.amount ?? 0) })),
              };
            } else {
              const perPerson = (totalAmount / recs.length).toFixed(2);
              groupTeam = {
                ...groupTeam,
                reimbursementRecipients: recs.map((r) => ({ userId: r.userId, amount: perPerson })),
              };
            }
          }
        }
        // Build PATCH body to match backend UpdateClaimDraftRequest (amount, merchant, category, description, expenseDate, status, reimburseToUserId, reimbursementRecipients)
        const patchBody: UpdateClaimDraftRequest = {
          amount: amountStr,
          merchant: values.merchant ?? '',
          category: values.category ?? 'Other',
          description: values.description ?? '',
          expenseDate: expenseDateStr,
          status: 'pending',
        };
        if (groupTeam.reimburseToUserId) {
          patchBody.reimburseToUserId = groupTeam.reimburseToUserId;
        }
        if (groupTeam.groupId) {
          patchBody.groupId = groupTeam.groupId;
        }
        if (groupTeam.teamId) {
          patchBody.teamId = groupTeam.teamId;
        }
        if (groupTeam.reimbursementRecipients?.length) {
          patchBody.reimbursementRecipients = groupTeam.reimbursementRecipients.map((r) => ({
            userId: r.userId,
            amount: r.amount,
          }));
        }
        await updateClaimDraft(draftId, patchBody);
        createdClaimTypeRef.current = null;
        setStep1ClaimTypeSummary(null);
        form.resetFields();
        setDraftId(null);
        setReceiptFile(undefined);
        setFlowStep('type');
        setStopPolling(false);
        onClose();
        return;
      }

      if (flowStep === 'upload' && !receiptFile) {
        message.warning('Please select a receipt to upload.');
        return;
      }
    } catch (e) {
      if ((e as Error)?.message !== 'validation') {
        // keep modal open on other errors
      }
    }
  };

  const handleCancel = () => {
    createdClaimTypeRef.current = null;
    setStep1ClaimTypeSummary(null);
    setSplitMode('auto');
    form.resetFields();
    setReceiptFile(undefined);
    setDraftId(null);
    setFlowStep('type');
    setStopPolling(false);
    onClose();
  };

  const handleBackFromUpload = () => {
    setReceiptFile(undefined);
    setStep1ClaimTypeSummary(null);
    setFlowStep('type');
  };

  const isUploadingOrWaiting = flowStep === 'uploading';
  const currentStepIndex = flowStep === 'type' ? 0 : flowStep === 'upload' ? 1 : flowStep === 'uploading' ? 1 : 2;

  const modalTitle =
    flowStep === 'uploading'
      ? 'Analyzing receipt…'
      : flowStep === 'type'
        ? 'New expense claim'
        : flowStep === 'upload'
          ? 'Upload receipt'
          : 'Review & submit';

  const steps = [
    { title: 'Claim type', description: 'Personal, group or team' },
    { title: 'Upload', description: 'Receipt & AI fill' },
    { title: 'Review', description: 'Edit and submit' },
  ];

  return (
    <Modal
      title={modalTitle}
      open={open}
      onOk={flowStep === 'upload' ? undefined : handleOk}
      onCancel={handleCancel}
      confirmLoading={isCreating || isUpdatingDraft}
      okButtonProps={{
        disabled: flowStep === 'uploading',
        style: flowStep === 'upload' ? { display: 'none' } : undefined,
      }}
      destroyOnClose
      okText={flowStep === 'review' ? 'Submit for approval' : flowStep === 'type' ? 'Next' : undefined}
      width={720}
      footer={
        flowStep === 'upload' ? (
          <div className="flex justify-between">
            <Button icon={<ArrowLeftOutlined />} onClick={handleBackFromUpload}>
              Back
            </Button>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" icon={<UploadOutlined />} loading={isCreating} disabled={!receiptFile} onClick={handleOk}>
                Upload & fill from AI
              </Button>
            </Space>
          </div>
        ) : flowStep === 'uploading' ? (
          <Button onClick={handleCancel}>Cancel</Button>
        ) : (
          undefined
        )
      }
    >
      <Steps current={currentStepIndex} size="small" className="mb-4" items={steps} />

      {isUploadingOrWaiting && !aiError && (
        <div className="mb-4 flex items-center gap-2 rounded border border-blue-200 bg-blue-50 p-3 text-blue-800">
          <Spin size="small" />
          <span>AI is extracting details from your receipt. The form will fill automatically.</span>
        </div>
      )}
      {aiError && flowStep !== 'type' && (
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message="AI analysis unavailable"
          description={
            <>
              <p className="mb-1">{aiError.message}</p>
              <p className="text-sm text-gray-600">You can fill in the amount, merchant, category and date below and submit manually.</p>
            </>
          }
        />
      )}

      <Form form={form} layout="vertical" className="mt-4">
        {/* Step 1: Claim type + group/team details */}
        {(flowStep === 'type' || flowStep === 'upload') && (
          <div className={flowStep === 'upload' ? 'rounded border border-slate-200 bg-slate-50 p-3 mb-4' : ''}>
            {flowStep === 'upload' && (
              <p className="text-sm text-slate-600 mb-2">
                Claim type: <strong>
                  {step1ClaimTypeSummary
                    ? step1ClaimTypeSummary.claimFor === 'personal'
                      ? 'Personal'
                      : step1ClaimTypeSummary.claimFor === 'group'
                        ? `Group · ${step1ClaimTypeSummary.groupName ?? '—'}`
                        : `Team · ${step1ClaimTypeSummary.teamName ?? '—'}`
                    : 'Personal'}
                </strong>
              </p>
            )}
            {flowStep === 'type' && (
              <>
                <Form.Item name="claimFor" label="Claim for" initialValue="personal">
                  <Radio.Group>
                    <Radio value="personal">Personal</Radio>
                    <Radio value="group">Group expense</Radio>
                    <Radio value="team">Team expense (TL only)</Radio>
                  </Radio.Group>
                </Form.Item>
        {claimFor === 'group' && (
          <>
            <Form.Item name="groupId" label="Group" rules={[{ required: true, message: 'Select a group' }]}>
              <Select
                placeholder="Select group"
                options={groups.map((g) => ({ label: g.name, value: g.id }))}
                disabled={flowStep !== 'type'}
              />
            </Form.Item>
            <Form.Item name="groupReimburseMode" initialValue="full_to_me">
              <Radio.Group disabled={flowStep !== 'type'}>
                <Radio value="full_to_me">Full amount to me (I paid)</Radio>
                <Radio value="split">Split reimbursement</Radio>
              </Radio.Group>
            </Form.Item>
            {groupReimburseMode === 'split' && (
              <Form.List name="splitRecipients">
                {(fields, { add, remove }) => (
                  <>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">Who gets reimbursed</span>
                      <Space size="small">
                        <Button
                          type="dashed"
                          size="small"
                          icon={<TeamOutlined />}
                          onClick={() => {
                            form.setFieldsValue({
                              splitRecipients: acceptedGroupMembers.map((m) => ({ userId: m.userId, amount: 0 })),
                            });
                          }}
                          disabled={!groupId || !acceptedGroupMembers.length || flowStep !== 'type'}
                        >
                          Add all from group
                        </Button>
                        <Button
                          type="dashed"
                          size="small"
                          icon={<UserAddOutlined />}
                          onClick={() => {
                            setSelectFromGroupSelected(
                              form.getFieldValue('splitRecipients')?.map((r: { userId: string }) => r.userId) ?? []
                            );
                            setSelectFromGroupOpen(true);
                          }}
                          disabled={!groupId || !acceptedGroupMembers.length || flowStep !== 'type'}
                        >
                          Select from group
                        </Button>
                        <Button type="dashed" onClick={() => add({ amount: 0 })} icon={<PlusOutlined />} size="small">
                          Add one
                        </Button>
                      </Space>
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Split amount:</span>
                      <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-0.5 text-sm">
                        <button
                          type="button"
                          onClick={() => setSplitMode('auto')}
                          className={`rounded-full px-3 py-1 transition-colors ${
                            splitMode === 'auto' ? 'text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
                          }`}
                          style={splitMode === 'auto' ? { backgroundColor: 'var(--xpense-primary, #1890ff)', borderColor: 'var(--xpense-primary, #1890ff)' } : undefined}
                        >
                          Auto
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitMode('manual')}
                          className={`rounded-full px-3 py-1 transition-colors ${
                            splitMode === 'manual' ? 'text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
                          }`}
                          style={splitMode === 'manual' ? { backgroundColor: 'var(--xpense-primary, #1890ff)', borderColor: 'var(--xpense-primary, #1890ff)' } : undefined}
                        >
                          Manual
                        </button>
                      </div>
                      <span className="text-xs text-slate-500">
                        {splitMode === 'auto' ? 'Equal split after AI extraction' : 'Enter amount per person'}
                      </span>
                    </div>
                    {fields.map(({ key, name }) => (
                      <div key={key} className="mb-2 flex gap-2 items-center">
                        <Form.Item name={[name, 'userId']} rules={[{ required: true }]} noStyle className="flex-1 min-w-0">
                          <Select
                            placeholder="Member"
                            options={acceptedGroupMembers.map((m) => ({ label: m.email ?? m.userId, value: m.userId }))}
                            disabled={flowStep !== 'type'}
                          />
                        </Form.Item>
                        <Form.Item name={[name, 'amount']} noStyle initialValue={0}>
                          <InputNumber
                            min={0}
                            step={0.01}
                            className="w-24"
                            placeholder={splitMode === 'auto' ? 'Auto' : '0'}
                            disabled={splitMode === 'auto'}
                          />
                        </Form.Item>
                        <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                      </div>
                    ))}
                  </>
                )}
              </Form.List>
            )}
          </>
        )}
        {claimFor === 'team' && (
          <>
            <Form.Item name="teamId" label="Team" rules={[{ required: true, message: 'Select a team' }]}>
              <Select
                placeholder="Select team (teams you lead)"
                options={teamsILead.map((t) => ({ label: t.name, value: t.id }))}
                disabled={flowStep !== 'type'}
              />
            </Form.Item>
            <Form.Item name="reimburseToUserId" label="Reimburse to" rules={[{ required: true, message: 'Choose who to reimburse' }]}>
              <Select
                placeholder="Team leader or member"
                options={teamReimburseOptions}
                disabled={flowStep !== 'type'}
              />
            </Form.Item>
          </>
        )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Receipt upload (only on upload step) */}
        {flowStep === 'upload' && (
          <Form.Item
            label="Receipt"
            required
            help={!receiptFile ? 'Select a receipt image or PDF' : undefined}
          >
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setReceiptFile(f ?? undefined);
              }}
            />
            {receiptFile && (
              <span className="mt-1 block text-sm text-gray-500">
                {receiptFile.name} – click &quot;Upload & fill from AI&quot; to extract details
              </span>
            )}
          </Form.Item>
        )}

        {/* Step 3: Review – expense fields (prefilled by AI); Group/Team read-only, split editable */}
        {flowStep === 'review' && (
          <>
            {(claim?.groupId || claim?.teamId) && (
              <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Claim type (from step 1)</div>
                {claim.teamId ? (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="text-slate-600">Team:</span>
                    <span className="font-medium">{teams.find((t) => t.id === claim.teamId)?.name ?? '—'}</span>
                    <span className="text-slate-600">Reimburse to:</span>
                    <span className="font-medium">{claim.reimburseToUserDisplayName || claim.reimburseToUserEmail || claim.reimburseToUserId || '—'}</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="text-slate-600">Group:</span>
                    <span className="font-medium">{groups.find((g) => g.id === claim.groupId)?.name ?? '—'}</span>
                    {claim.reimbursementRecipients && claim.reimbursementRecipients.length > 1 && (
                      <span className="text-slate-500">Split between {claim.reimbursementRecipients.length} people (editable below)</span>
                    )}
                  </div>
                )}
              </div>
            )}
            {flowStep === 'review' && claim?.groupId && claim?.reimbursementRecipients && claim.reimbursementRecipients.length > 1 && (
              <Form.Item label="Split amounts (edit before submit)" className="mb-4">
                <Form.List name="splitRecipients">
                  {(fields) => (
                    <div className="space-y-2">
                      {fields.map(({ key, name }) => {
                        const rec = claim.reimbursementRecipients?.[name];
                        const label = rec?.displayName || rec?.email || rec?.userId?.slice(0, 8) + '…' || '—';
                        return (
                          <div key={key} className="flex gap-2 items-center">
                            <Form.Item name={[name, 'userId']} noStyle hidden>
                              <Input type="hidden" />
                            </Form.Item>
                            <span className="flex-1 min-w-0 truncate text-sm text-slate-700" title={String(label)}>{label}</span>
                            <Form.Item name={[name, 'amount']} rules={[{ required: true, message: 'Amount' }]} noStyle className="mb-0">
                              <InputNumber min={0} step={0.01} className="w-28" placeholder="0" />
                            </Form.Item>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Form.List>
              </Form.Item>
            )}
        <Form.Item
          name="amountNum"
          label="Amount"
          rules={[{ required: true, message: 'Enter amount' }]}
          help={
            showMealsCapWarning ? (
              <Alert
                type="warning"
                showIcon
                message={`Only INR ${MEALS_CAP} will be reimbursed for this day (policy cap). Amount over cap is not refunded.`}
                className="mt-1"
              />
            ) : undefined
          }
        >
          <InputNumber
            min={0}
            step={0.1}
            className="w-full"
            placeholder="0.00"
          />
        </Form.Item>
        <Form.Item
          name="merchant"
          label="Merchant"
          rules={[{ required: true, message: 'Enter merchant' }]}
        >
          <Input placeholder="e.g. Starbucks" />
        </Form.Item>
        <Form.Item name="category" label="Category" initialValue="Other">
          <Select
            options={categoryOptions.map((c) => ({ label: c, value: c }))}
            placeholder="Select category"
          />
        </Form.Item>
        {showSoftwareOption && (
          <Form.Item
            name="softwareReimburseOption"
            label={`Reimburse option ($${SOFTWARE_MONTHLY_CAP_USD}/month cap)`}
            initialValue="cap_only"
            tooltip={`Reimburse only $${SOFTWARE_MONTHLY_CAP_USD} this month, or reimburse full amount and deduct the excess from next month's allowance.`}
          >
            <Radio.Group>
              <Radio value="cap_only">Reimburse only ${SOFTWARE_MONTHLY_CAP_USD} this month (spill over ignored)</Radio>
              <Radio value="full_deduct_next_month">Reimburse full now, deduct excess from next month</Radio>
            </Radio.Group>
          </Form.Item>
        )}
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Optional description" />
        </Form.Item>
        <Form.Item
          name="expenseDate"
          label="Expense date"
          rules={[{ required: true, message: 'Expense date is required' }]}
        >
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>
            <p className="text-sm text-gray-500">
              Review and edit the fields above, then click &quot;Submit for approval&quot;.
            </p>
          </>
        )}
      </Form>
      <Modal
        title="Select members from group"
        open={selectFromGroupOpen}
        onCancel={() => setSelectFromGroupOpen(false)}
        onOk={() => {
          if (selectFromGroupSelected.length === 0) {
            message.warning('Select at least one member.');
            return;
          }
          const amt = form.getFieldValue('amountNum') ?? 0;
          const perPerson =
            selectFromGroupSelected.length > 0
              ? Number((Number(amt) / selectFromGroupSelected.length).toFixed(2))
              : 0;
          form.setFieldsValue({
            splitRecipients: selectFromGroupSelected.map((userId) => ({ userId, amount: perPerson })),
          });
          setSelectFromGroupOpen(false);
        }}
        okText="Add selected"
      >
        <p className="mb-2 text-sm text-gray-600">Choose who gets reimbursed (sum will equal claim amount).</p>
        <Select
          mode="multiple"
          placeholder="Select members"
          value={selectFromGroupSelected}
          onChange={setSelectFromGroupSelected}
          style={{ width: '100%' }}
          options={acceptedGroupMembers.map((m) => ({ label: m.email ?? m.userId, value: m.userId }))}
        />
      </Modal>
    </Modal>
  );
}
