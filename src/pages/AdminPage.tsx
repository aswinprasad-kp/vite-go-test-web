import { useState } from 'react';
import { EditOutlined, SafetyOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Checkbox, Modal, Space, Table, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  useAdminPermissions,
  useAdminRoles,
  useAdminUsers,
  useCreateRole,
  useSetRolePermissions,
  useSetUserRoles,
  useUpdateRole,
  type Role,
  type UserWithRoles,
} from '../hooks/useAdmin';

export default function AdminPage() {
  const { permissions, isLoading: permLoading } = useAdminPermissions();
  const { roles, isLoading: rolesLoading, mutate: mutateRoles } = useAdminRoles();
  const { users, isLoading: usersLoading, mutate: mutateUsers } = useAdminUsers();
  const { createRole, isCreating } = useCreateRole(() => {
    mutateRoles();
    setCreateModalOpen(false);
  });
  const { updateRole, isUpdating } = useUpdateRole(() => {
    mutateRoles();
    setEditModalRole(null);
  });
  const { setRolePermissions, isUpdating: isSettingPerms } = useSetRolePermissions(() => {
    mutateRoles();
    setPermsModalRole(null);
  });
  const { setUserRoles, isUpdating: isSettingUserRoles } = useSetUserRoles(() => {
    mutateUsers();
    setUserRolesModalUser(null);
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalRole, setEditModalRole] = useState<Role | null>(null);
  const [permsModalRole, setPermsModalRole] = useState<Role | null>(null);
  const [userRolesModalUser, setUserRolesModalUser] = useState<UserWithRoles | null>(null);

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-lg font-semibold">Admin – Roles &amp; Permissions</h2>
      </div>
      <Tabs
        items={[
          {
            key: 'roles',
            label: 'Roles',
            children: (
              <RolesTab
                roles={roles}
                loading={permLoading || rolesLoading}
                onNewRole={() => setCreateModalOpen(true)}
                onEditRole={setEditModalRole}
                onEditPermissions={setPermsModalRole}
              />
            ),
          },
          {
            key: 'users',
            label: 'Users',
            children: (
              <UsersTab
                roles={roles}
                users={users}
                loading={usersLoading}
                onEditUserRoles={setUserRolesModalUser}
              />
            ),
          },
        ]}
      />

      <CreateRoleModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        permissions={permissions}
        onSubmit={async (name, description, permissionKeys) => {
          await createRole({ name, description, permissionKeys });
        }}
        loading={isCreating}
      />
      {editModalRole && (
        <EditRoleModal
          role={editModalRole}
          onClose={() => setEditModalRole(null)}
          onSubmit={async (name, description) => {
            await updateRole({ roleId: editModalRole.id, name, description });
          }}
          loading={isUpdating}
        />
      )}
      {permsModalRole && (
        <EditRolePermissionsModal
          role={permsModalRole}
          permissions={permissions}
          onClose={() => setPermsModalRole(null)}
          onSubmit={async (permissionKeys) => {
            await setRolePermissions({ roleId: permsModalRole.id, permissionKeys });
          }}
          loading={isSettingPerms}
        />
      )}
      {userRolesModalUser && (
        <EditUserRolesModal
          user={userRolesModalUser}
          roles={roles}
          onClose={() => setUserRolesModalUser(null)}
          onSubmit={async (roleIds) => {
            await setUserRoles({ userId: userRolesModalUser.userId, roleIds });
          }}
          loading={isSettingUserRoles}
        />
      )}
    </div>
  );
}

function RolesTab({
  roles,
  loading,
  onNewRole,
  onEditRole,
  onEditPermissions,
}: {
  roles: Role[];
  loading: boolean;
  onNewRole: () => void;
  onEditRole: (r: Role) => void;
  onEditPermissions: (r: Role) => void;
}) {
  const columns: ColumnsType<Role> = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 160 },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Permissions',
      dataIndex: 'permissionKeys',
      key: 'permissionKeys',
      render: (keys: string[]) => (
        <Space size={[0, 4]} wrap>
          {(keys ?? []).slice(0, 5).map((k) => (
            <Tag key={k}>{k}</Tag>
          ))}
          {(keys?.length ?? 0) > 5 && <Tag>+{(keys?.length ?? 0) - 5}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" ghost size="small" icon={<EditOutlined />} onClick={() => onEditRole(record)}>
            Edit
          </Button>
          <Button type="default" size="small" icon={<SafetyOutlined />} onClick={() => onEditPermissions(record)}>
            Permissions
          </Button>
        </Space>
      ),
    },
  ];
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button type="primary" onClick={onNewRole}>
          New role
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={roles}
        loading={loading}
        pagination={false}
        size="small"
      />
    </div>
  );
}

function UsersTab({
  roles,
  users,
  loading,
  onEditUserRoles,
}: {
  roles: Role[];
  users: UserWithRoles[];
  loading: boolean;
  onEditUserRoles: (u: UserWithRoles) => void;
}) {
  const roleIdToName = Object.fromEntries(roles.map((r) => [r.id, r.name]));
  const columns: ColumnsType<UserWithRoles> = [
    { title: 'Email', dataIndex: 'email', key: 'email', width: 220 },
    { title: 'Display name', dataIndex: 'displayName', key: 'displayName', ellipsis: true },
    {
      title: 'Roles',
      dataIndex: 'roleIds',
      key: 'roleIds',
      render: (ids: string[]) => (
        <Space size={[0, 4]} wrap>
          {(ids ?? []).map((id) => (
            <Tag key={id}>{roleIdToName[id] ?? id}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <Button type="primary" ghost size="small" icon={<TeamOutlined />} onClick={() => onEditUserRoles(record)}>
          Edit roles
        </Button>
      ),
    },
  ];
  return (
    <Table
      rowKey="userId"
      columns={columns}
      dataSource={users}
      loading={loading}
      pagination={{ pageSize: 20 }}
      size="small"
    />
  );
}

function CreateRoleModal({
  open,
  onClose,
  permissions,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  permissions: { id: string; key: string; description: string }[];
  onSubmit: (name: string, description: string, permissionKeys: string[]) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const handleOk = async () => {
    if (!name.trim()) return;
    await onSubmit(name.trim(), description.trim(), selectedKeys);
    setName('');
    setDescription('');
    setSelectedKeys([]);
  };

  return (
    <Modal
      title="New role"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Create"
      confirmLoading={loading}
      destroyOnClose
      width={480}
    >
      <div className="mb-4">
        <label className="block text-sm text-slate-600 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="e.g. auditor"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm text-slate-600 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Optional"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-2">Permissions</label>
        <div className="max-h-48 overflow-y-auto rounded border border-gray-200 p-2">
          {permissions.map((p) => (
            <div key={p.id} className="py-1">
              <Checkbox
                checked={selectedKeys.includes(p.key)}
                onChange={(e) =>
                  setSelectedKeys((prev) =>
                    e.target.checked ? [...prev, p.key] : prev.filter((k) => k !== p.key)
                  )
                }
              >
                {p.key}
                {p.description && <span className="text-slate-500 text-xs ml-1">({p.description})</span>}
              </Checkbox>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function EditRoleModal({
  role,
  onClose,
  onSubmit,
  loading,
}: {
  role: Role;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? '');

  const handleOk = async () => {
    if (!name.trim()) return;
    await onSubmit(name.trim(), description.trim());
  };

  return (
    <Modal
      title="Edit role"
      open
      onCancel={onClose}
      onOk={handleOk}
      okText="Save"
      confirmLoading={loading}
      destroyOnClose
    >
      <div className="mb-4">
        <label className="block text-sm text-slate-600 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
    </Modal>
  );
}

function EditRolePermissionsModal({
  role,
  permissions,
  onClose,
  onSubmit,
  loading,
}: {
  role: Role;
  permissions: { id: string; key: string; description: string }[];
  onClose: () => void;
  onSubmit: (permissionKeys: string[]) => Promise<void>;
  loading: boolean;
}) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(role.permissionKeys ?? []);

  const handleOk = async () => {
    await onSubmit(selectedKeys);
  };

  return (
    <Modal
      title={`Permissions: ${role.name}`}
      open
      onCancel={onClose}
      onOk={handleOk}
      okText="Save"
      confirmLoading={loading}
      destroyOnClose
      width={500}
    >
      <div className="max-h-64 overflow-y-auto rounded border border-gray-200 p-2">
        {permissions.map((p) => (
          <div key={p.id} className="py-1">
            <Checkbox
              checked={selectedKeys.includes(p.key)}
              onChange={(e) =>
                setSelectedKeys((prev) =>
                  e.target.checked ? [...prev, p.key] : prev.filter((k) => k !== p.key)
                )
              }
            >
              {p.key}
              {p.description && <span className="text-slate-500 text-xs ml-1">({p.description})</span>}
            </Checkbox>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function EditUserRolesModal({
  user,
  roles,
  onClose,
  onSubmit,
  loading,
}: {
  user: UserWithRoles;
  roles: Role[];
  onClose: () => void;
  onSubmit: (roleIds: string[]) => Promise<void>;
  loading: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(user.roleIds ?? []);

  const handleOk = async () => {
    await onSubmit(selectedIds);
  };

  return (
    <Modal
      title={`Roles: ${user.email}`}
      open
      onCancel={onClose}
      onOk={handleOk}
      okText="Save"
      confirmLoading={loading}
      destroyOnClose
      width={440}
    >
      <div className="max-h-64 overflow-y-auto rounded border border-gray-200 p-2">
        {roles.map((r) => (
          <div key={r.id} className="py-1">
            <Checkbox
              checked={selectedIds.includes(r.id)}
              onChange={(e) =>
                setSelectedIds((prev) =>
                  e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                )
              }
            >
              {r.name}
              {r.description && <span className="text-slate-500 text-xs ml-1">({r.description})</span>}
            </Checkbox>
          </div>
        ))}
      </div>
    </Modal>
  );
}
