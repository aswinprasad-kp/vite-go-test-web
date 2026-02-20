import { Badge, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import type { UserSession } from '../types/auth';

interface TitleBarProps {
  user: UserSession;
  title?: string;
}

const roleBadge: Record<string, { color: string; text: string }> = {
  admin: { color: 'red', text: 'Admin' },
  finance_admin: { color: 'green', text: 'Finance' },
  manager: { color: 'blue', text: 'Manager' },
  employee: { color: 'default', text: 'Employee' },
};

export default function TitleBar({ user, title = 'Claims' }: TitleBarProps) {
  const role = roleBadge[user.role] ?? { color: 'default', text: user.role };
  const menuItems: MenuProps['items'] = [
    { key: 'profile', label: 'Profile', disabled: true },
    { key: 'settings', label: 'Settings', disabled: true },
  ];

  const displayName = user.displayName ?? user.name;
  return (
    <header className="flex flex-1 items-center justify-between">
      <h1 className="text-xl font-semibold tracking-tight text-slate-800">{title}</h1>
      <div className="flex items-center gap-4">
        <Badge
          status="success"
          text={<span className="text-sm text-slate-500">{role.text}</span>}
        />
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-left shadow-sm transition-colors hover:bg-slate-50 focus:outline-none"
          >
            <img
              src={user.picture}
              alt={displayName}
              className="h-8 w-8 rounded-full border-2 border-slate-100 object-cover"
            />
            <span className="max-w-[160px] truncate text-sm font-medium text-slate-700">
              {displayName}
            </span>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
