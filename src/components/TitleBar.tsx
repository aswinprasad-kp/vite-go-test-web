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
    <header className="flex h-14 flex-1 items-center justify-between border-b bg-[var(--xpense-header-bg)] px-6 [border-color:var(--xpense-border)]">
      <h1 className="text-lg font-semibold [color:var(--xpense-text)]">{title}</h1>
      <div className="flex items-center gap-4">
        <Badge
          status="success"
          text={<span className="text-sm [color:var(--xpense-text-secondary)]">{role.text}</span>}
        />
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left focus:outline-none [background:var(--xpense-btn-secondary-hover-bg)] [border-color:var(--xpense-border)] hover:[background:var(--xpense-border-light)]"
          >
            <img
              src={user.picture}
              alt={displayName}
              className="h-8 w-8 rounded-full border object-cover [border-color:var(--xpense-border)]"
            />
            <span className="max-w-[160px] truncate text-sm font-medium [color:var(--xpense-text)]">
              {displayName}
            </span>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
