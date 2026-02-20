import { Form, Input, InputNumber, Modal, Select } from 'antd';
import type { CreateClaimRequest } from '../types/claim';

interface CreateClaimModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateClaimRequest) => Promise<void>;
  loading?: boolean;
}

const categoryOptions = ['Meals', 'Travel', 'Supplies', 'Software', 'Other'];

export default function CreateClaimModal({
  open,
  onClose,
  onSubmit,
  loading,
}: CreateClaimModalProps) {
  const [form] = Form.useForm<CreateClaimRequest & { amountNum?: number }>();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const amount = values.amountNum ?? values.amount ?? 0;
      await onSubmit({
        amount: typeof amount === 'number' ? String(amount) : String(amount ?? 0),
        merchant: values.merchant ?? '',
        category: values.category ?? 'Other',
        description: values.description ?? '',
        receiptUrl: values.receiptUrl,
      });
      form.resetFields();
      onClose();
    } catch {
      // validation or submit error – keep modal open
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="New expense claim"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnHidden
      okText="Submit"
      width={480}
    >
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
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Optional description" />
        </Form.Item>
        <Form.Item name="receiptUrl" label="Receipt URL (optional)" hidden>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
