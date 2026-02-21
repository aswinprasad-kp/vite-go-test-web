import { useEffect } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import { useUpdateClaimDraft } from '../../hooks/useClaimsMutation';
import type { Claim, UpdateClaimDraftRequest } from '../../types/claim';

const categoryOptions = ['Meals', 'Travel', 'Supplies', 'Software', 'AI Purchase', 'Other'];

type FormValues = {
  amountNum: number;
  merchant: string;
  category: string;
  description?: string;
  expenseDate?: Dayjs;
};

interface EditDraftModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  claim: Claim | null;
}

export default function EditDraftModal({
  open,
  onClose,
  onSuccess,
  claim,
}: EditDraftModalProps) {
  const [form] = Form.useForm<FormValues>();
  const { updateClaimDraft, isUpdatingDraft } = useUpdateClaimDraft(onSuccess);

  useEffect(() => {
    if (open && claim) {
      form.setFieldsValue({
        amountNum: claim.amount ? parseFloat(claim.amount) : 0,
        merchant: claim.merchant ?? '',
        category: claim.category && categoryOptions.includes(claim.category) ? claim.category : 'Other',
        description: claim.description ?? '',
        expenseDate: claim.expenseDate ? dayjs(claim.expenseDate) : undefined,
      });
    }
  }, [open, claim, form]);

  const handleOk = async () => {
    if (!claim) return;
    try {
      const values = await form.validateFields();
      const expenseDateVal = values.expenseDate as Dayjs | undefined;
      const payload: UpdateClaimDraftRequest = {
        amount: String(values.amountNum ?? 0),
        merchant: values.merchant ?? '',
        category: values.category ?? 'Other',
        description: values.description ?? '',
        expenseDate: expenseDateVal ? expenseDateVal.format('YYYY-MM-DD') : undefined,
      };
      await updateClaimDraft(claim.id, payload);
      form.resetFields();
      onClose();
    } catch {
      // validation or submit error
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Edit draft"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={isUpdatingDraft}
      destroyOnClose
      okText="Save"
      width={480}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="amountNum"
          label="Amount"
          rules={[{ required: true, message: 'Enter amount' }]}
        >
          <InputNumber min={0} step={0.1} className="w-full" placeholder="0.00" />
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
      </Form>
    </Modal>
  );
}
