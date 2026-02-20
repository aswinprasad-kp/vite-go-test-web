import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { DatePicker, Form, Input, InputNumber, Modal, Select, Spin } from 'antd';
import {
  useCreateClaim,
  useGetClaim,
  useUpdateClaimDraft,
} from '../hooks/useClaimsMutation';
import { useUploadReceiptForClaim } from '../hooks/useReceiptUpload';
import type { CreateClaimRequest } from '../types/claim';

interface CreateClaimModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const categoryOptions = ['Meals', 'Travel', 'Supplies', 'Software', 'Other'];
const categoryMap: Record<string, string> = {
  meals: 'Meals',
  travel: 'Travel',
  supplies: 'Supplies',
  software: 'Software',
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
  const [form] = Form.useForm<CreateClaimRequest & { amountNum?: number }>();
  const [receiptFile, setReceiptFile] = useState<File | undefined>();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'uploading' | 'prefilled'>('form');

  const { createClaim, isCreating } = useCreateClaim(onSuccess);
  const { uploadReceipt } = useUploadReceiptForClaim();
  const { updateClaimDraft, isUpdatingDraft } = useUpdateClaimDraft(onSuccess);
  const { claim } = useGetClaim(
    step === 'uploading' || step === 'prefilled' ? draftId : null,
    step === 'uploading' ? { refreshInterval: 2000 } : undefined
  );

  // When AI fill is ready, pre-fill form and move to prefilled
  useEffect(() => {
    if (step !== 'uploading' || !claim) return;
    const hasAi = claim.aiAnalysis != null && Object.keys(claim.aiAnalysis).length > 0;
    if (hasAi) {
      const amount = claim.amount ? parseFloat(claim.amount) : undefined;
      form.setFieldsValue({
        amountNum: amount,
        merchant: claim.merchant ?? '',
        category: toFormCategory(claim.category),
        description: claim.description ?? '',
        expenseDate: claim.expenseDate ? dayjs(claim.expenseDate) : undefined,
      });
      setStep('prefilled');
    }
  }, [step, claim, form]);

  const handleOk = async () => {
    try {
      // Upload-only path: no validation – we create an empty draft and AI will fill later
      if (receiptFile && step === 'form') {
        const newClaim = await createClaim(EMPTY_DRAFT);
        if (!newClaim?.id) return;
        setDraftId(newClaim.id);
        setStep('uploading');
        await uploadReceipt(newClaim.id, receiptFile);
        setReceiptFile(undefined);
        return;
      }

      const values = await form.validateFields();
      const amount = values.amountNum ?? values.amount ?? 0;
      const expenseDateVal = values.expenseDate as Dayjs | undefined;
      const expenseDateStr = expenseDateVal ? expenseDateVal.format('YYYY-MM-DD') : undefined;
      const payload = {
        amount: typeof amount === 'number' ? String(amount) : String(amount ?? 0),
        merchant: values.merchant ?? '',
        category: values.category ?? 'Other',
        description: values.description ?? '',
        expenseDate: expenseDateStr,
      };

      // Already pre-filled from AI; user clicked Submit to send edits and submit for approval
      if (draftId && step === 'prefilled') {
        await updateClaimDraft(draftId, {
          ...payload,
          status: 'pending',
        });
        form.resetFields();
        setDraftId(null);
        setReceiptFile(undefined);
        setStep('form');
        onClose();
        return;
      }

      // No receipt: create claim with form data (manual)
      await createClaim(payload);
      form.resetFields();
      onClose();
    } catch {
      // validation or submit error – keep modal open
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setReceiptFile(undefined);
    setDraftId(null);
    setStep('form');
    onClose();
  };

  const isUploadingOrWaiting = step === 'uploading';
  const isSubmitDisabled = step === 'uploading';
  const okText =
    step === 'prefilled'
      ? 'Submit for approval'
      : receiptFile
        ? 'Upload & fill from AI'
        : 'Create claim';

  return (
    <Modal
      title={step === 'uploading' ? 'Analyzing receipt…' : 'New expense claim'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={isCreating || isUpdatingDraft}
      okButtonProps={{ disabled: isSubmitDisabled }}
      destroyOnClose
      okText={okText}
      width={480}
    >
      {isUploadingOrWaiting && (
        <div className="mb-4 flex items-center gap-2 rounded border border-blue-200 bg-blue-50 p-3 text-blue-800">
          <Spin size="small" />
          <span>AI is extracting details from your receipt. The form will fill automatically.</span>
        </div>
      )}
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="amountNum"
          label="Amount"
          rules={[{ required: true, message: 'Enter amount' }]}
        >
          <InputNumber
            min={0}
            step={0.01}
            className="w-full"
            placeholder="0.00"
            disabled={isUploadingOrWaiting}
          />
        </Form.Item>
        <Form.Item
          name="merchant"
          label="Merchant"
          rules={[{ required: true, message: 'Enter merchant' }]}
        >
          <Input
            placeholder="e.g. Starbucks"
            disabled={isUploadingOrWaiting}
          />
        </Form.Item>
        <Form.Item name="category" label="Category" initialValue="Other">
          <Select
            options={categoryOptions.map((c) => ({ label: c, value: c }))}
            placeholder="Select category"
            disabled={isUploadingOrWaiting}
          />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea
            rows={2}
            placeholder="Optional description"
            disabled={isUploadingOrWaiting}
          />
        </Form.Item>
        <Form.Item name="expenseDate" label="Expense date">
          <DatePicker
            className="w-full"
            format="YYYY-MM-DD"
            disabled={isUploadingOrWaiting}
          />
        </Form.Item>
        {step === 'form' && (
          <Form.Item label="Receipt (optional – upload first to auto-fill)">
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
        {step === 'prefilled' && (
          <p className="text-sm text-gray-500">
            Review and edit the fields above, then click &quot;Submit for approval&quot;.
          </p>
        )}
      </Form>
    </Modal>
  );
}
