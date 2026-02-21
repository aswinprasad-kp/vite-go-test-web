import { useState } from 'react';
import { PlusOutlined, UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { Button, Card, Input, message, Modal, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  useTeams,
  useTeamMembers,
  useCreateTeam,
  useAddTeamMember,
  useRemoveTeamMember,
  type Team,
  type TeamMember,
} from '../hooks/useTeams';
import { useAuth } from '../hooks/useAuth';
import AppTable from '../core-utils/components/AppTable';

export default function TeamsPage() {
  const { user } = useAuth();
  const { teams, isLoading, mutate } = useTeams();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const { createTeam, isCreating, error: createError } = useCreateTeam(() => {
    mutate();
    setCreateModalOpen(false);
  });

  const handleCreate = async (name: string, description: string) => {
    try {
      await createTeam({ name: name.trim(), description: description.trim() });
      message.success('Team created');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      message.error(err.response?.data?.error ?? 'Failed to create team');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-lg font-semibold">Teams</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          Create team
        </Button>
      </div>

      {createError && message.error(createError.message)}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <Card
            key={t.id}
            hoverable
            onClick={() => setSelectedTeam(t)}
            title={t.name}
            extra={t.leaderId === user?.uid ? <span className="text-xs text-slate-500">Leader</span> : undefined}
          >
            {t.description && <p className="text-sm text-slate-600">{t.description}</p>}
          </Card>
        ))}
      </div>
      {!isLoading && teams.length === 0 && (
        <p className="text-slate-500">No teams yet. Create one if you are a Team Leader.</p>
      )}

      <CreateTeamModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        loading={isCreating}
      />

      {selectedTeam && (
        <TeamDetailModal
          team={selectedTeam}
          onClose={() => { setSelectedTeam(null); mutate(); }}
          onMutate={mutate}
        />
      )}
    </div>
  );
}

function CreateTeamModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const handleOk = async () => {
    if (!name.trim()) return;
    await onSubmit(name, description);
    setName('');
    setDescription('');
  };
  return (
    <Modal
      title="Create team"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Create"
      destroyOnClose
    >
      <Space direction="vertical" className="w-full">
        <Input
          placeholder="Team name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input.TextArea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </Space>
    </Modal>
  );
}

function TeamDetailModal({
  team,
  onClose,
  onMutate,
}: {
  team: Team;
  onClose: () => void;
  onMutate: () => void;
}) {
  const { members, isLoading, mutate } = useTeamMembers(team.id);
  const [addEmail, setAddEmail] = useState('');
  const { addMember, isAdding } = useAddTeamMember(team.id, () => {
    mutate();
    setAddEmail('');
  });
  const { removeMember, isRemoving } = useRemoveTeamMember(team.id, () => {
    mutate();
    onMutate();
  });

  const handleAdd = async () => {
    if (!addEmail.trim()) return;
    try {
      await addMember({ email: addEmail.trim() });
      message.success('Member added');
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
      message.error(err.response?.data?.error ?? 'Failed to remove member');
    }
  };

  const columns: ColumnsType<TeamMember> = [
    { title: 'Email', dataIndex: 'email', key: 'email', width: 220, ellipsis: true, render: (v: string) => v || '—' },
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
          icon={<UserDeleteOutlined />}
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
      title={team.name}
      open={true}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnClose
    >
      {team.description && <p className="mb-4 text-slate-600">{team.description}</p>}
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Email to add"
          value={addEmail}
          onChange={(e) => setAddEmail(e.target.value)}
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
        rowKey="userId"
        loading={isLoading}
        pagination={false}
        scrollX={400}
      />
    </Modal>
  );
}
