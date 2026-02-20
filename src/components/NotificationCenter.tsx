import { Badge, Dropdown } from 'antd';
import type { MenuProps } from 'antd';

const items: MenuProps['items'] = [
  { key: 'empty', label: 'No new notifications', disabled: true },
];

export default function NotificationCenter() {
  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button
        type="button"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border [background:var(--xpense-bg-card)] [border-color:var(--xpense-border)] [color:var(--xpense-text-secondary)] hover:[background:var(--xpense-btn-secondary-hover-bg)]"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        <Badge count={0} size="small" className="absolute -right-0.5 -top-0.5" />
      </button>
    </Dropdown>
  );
}
