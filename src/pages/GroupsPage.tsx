import { useState } from 'react';
import { CheckOutlined, CloseOutlined, PlusOutlined, UserAddOutlined } from '@ant-design/icons';
import { Button, Card, Input, message, Modal, Space, Tag } from 'antd';
import {
  useGroups,
  useGroupInvites,
  useGroupMembers,
  useCreateGroup,
  useAddGroupMember,
  useAcceptGroupInvite,
  useRejectGroupInvite,
  useRemoveGroupMember,
  type Group,
  type GroupMember,
} from '../hooks/useGroups';
import AppTable from '../core-utils/components/AppTable';
import type { ColumnsType } from 'antd/es/table';

export default function GroupsPage() {
  const { groups, isLoading, mutate } = useGroups();
  const { invites, isLoading: invitesLoading, mutate: mutateInvites } = useGroupInvites();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const { createGroup, isCreating } = useCreateGroup(() => {
    mutate();
    setCreateModalOpen(false);
  });
  const { acceptInvite, isAccepting } = useAcceptGroupInvite(() => {
    mutateInvites();
    mutate();
  });
  const { rejectInvite, isRejecting } = useRejectGroupInvite(() => {
    mutateInvites();
  });

  const handleCreate = async (name: string) => {
    if (!name.trim()) return;
    try {
      await createGroup({ name: name.trim() });
      message.success('Group created');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      message.error(err.response?.data?.error ?? 'Failed to create group');
    }
  };

  const handleAccept = async (groupId: string) => {
    try {
      await acceptInvite({ groupId });
      message.success('Invite accepted');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      message.error(err.response?.data?.error ?? 'Failed to accept');
    }
  };

  const handleReject = async (groupId: string) => {
    try {
      await rejectInvite({ groupId });
      message.success('Invite rejected');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      message.error(err.response?.data?.error ?? 'Failed to reject');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-lg font-semibold">Groups</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          Create group
        </Button>
      </div>

      {invites.length > 0 && (
        <Card title="Pending invites" className="mb-6">
          {invitesLoading ? (
            <p className="text-slate-500">Loading…</p>
          ) : (
            <Space direction="vertical" className="w-full">
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded border border-slate-200 p-3"
                >
                  <span>Group invite (group id: {inv.groupId.slice(0, 8)}…)</span>
                  <Space>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleAccept(inv.groupId)}
                      loading={isAccepting}
                    >
                      Accept
                    </Button>
                    <Button
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => handleReject(inv.groupId)}
                      loading={isRejecting}
                    >
                      Reject
                    </Button>
                  </Space>
                </div>
              ))}
            </Space>
          )}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <Card
            key={g.id}
            hoverable
            onClick={() => setSelectedGroup(g)}
            title={g.name}
          >
            <p className="text-sm text-slate-600">
              {typeof g.memberCount === 'number' ? `${g.memberCount} member${g.memberCount !== 1 ? 's' : ''}` : '—'}
            </p>
          </Card>
        ))}
      </div>
      {!isLoading && groups.length === 0 && invites.length === 0 && (
        <p className="text-slate-500">No groups yet. Create one to club members for budget sharing.</p>
      )}

      <CreateGroupModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        loading={isCreating}
      />

      {selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          onClose={() => { setSelectedGroup(null); mutate(); mutateInvites(); }}
          onMutate={() => { mutate(); mutateInvites(); }}
        />
      )}
    </div>
  );
}

function CreateGroupModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const handleOk = async () => {
    if (!name.trim()) return;
    await onSubmit(name);
    setName('');
  };
  return (
    <Modal
      title="Create group"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Create"
      destroyOnClose
    >
      <Input
        placeholder="Group name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </Modal>
  );
}

function GroupDetailModal({
  group,
  onClose,
  onMutate,
}: {
  group: Group;
  onClose: () => void;
  onMutate: () => void;
}) {
  const { members, isLoading, mutate } = useGroupMembers(group.id);
  const [addEmailOrId, setAddEmailOrId] = useState('');
  const { addMember, isAdding } = useAddGroupMember(group.id, () => {
    mutate();
    setAddEmailOrId('');
  });
  const { removeMember, isRemoving } = useRemoveGroupMember(group.id, () => {
    mutate();
    onMutate();
  });

  const handleAdd = async () => {
    if (!addEmailOrId.trim()) return;
    try {
      await addMember(
        addEmailOrId.trim().includes('@') ? { email: addEmailOrId.trim() } : { userId: addEmailOrId.trim() }
      );
      message.success('Invite sent (pending until they accept)');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      message.error(err.response?.data?.error ?? 'Failed to add member');
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await removeMember({ userId });
      message.success('Member removed');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      message.error(err.response?.data?.error ?? 'Failed to remove');
    }
  };

  const columns: ColumnsType<GroupMember> = [
    { title: 'Email', dataIndex: 'email', key: 'email', width: 220, ellipsis: true, render: (v: string) => v || '—' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'accepted' ? 'green' : 'orange'}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'left',
      render: (_, record) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() => handleRemove(record.userId)}
          loading={isRemoving}
          className="pl-0"
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={group.name}
      open={true}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnClose
    >
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Email to invite"
          value={addEmailOrId}
          onChange={(e) => setAddEmailOrId(e.target.value)}
          onPressEnter={handleAdd}
          style={{ maxWidth: 280 }}
        />
        <Button type="primary" icon={<UserAddOutlined />} onClick={handleAdd} loading={isAdding}>
          Add member
        </Button>
      </div>
      <AppTable
        dataSource={members}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        scrollX={500}
      />
    </Modal>
  );
}
