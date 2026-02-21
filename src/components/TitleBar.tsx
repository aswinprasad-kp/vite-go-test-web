import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import type { UserSession } from '../types/auth';
import { roleToDisplayLabel } from '../core-utils/format';

interface TitleBarProps {
  user: UserSession;
  title?: string;
}

export default function TitleBar({ user, title = 'Claims' }: TitleBarProps) {
  const roleLabel = roleToDisplayLabel(user.role ?? '');
  const menuItems: MenuProps['items'] = [
    { key: 'profile', label: 'Profile', disabled: true },
    { key: 'settings', label: 'Settings', disabled: true },
  ];

  const displayName = user.displayName ?? user.name;
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
      <h1 className="truncate text-base font-semibold tracking-tight text-slate-800 sm:text-lg">{title}</h1>
      <div className="flex shrink-0 items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm text-slate-500" style={{ lineHeight: 1 }}>
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-500" aria-hidden />
          <span className="leading-none">{roleLabel}</span>
        </span>
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <button
            type="button"
            className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white/80 pl-2 pr-3 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--xpense-primary)] focus:ring-offset-1"
          >
            <img
              src={user.picture}
              alt={displayName}
              className="h-7 w-7 shrink-0 rounded-full border border-slate-100 object-cover"
            />
            <span className="max-w-[140px] truncate text-sm font-medium leading-none text-slate-700">
              {displayName}
            </span>
          </button>
        </Dropdown>
      </div>
    </div>
  );
}
