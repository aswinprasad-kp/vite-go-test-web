import { useState } from 'react';
import { Select } from 'antd';
import { axiosInstance } from '../core-utils/axiosInstance';
import type { UserSession } from '../types/auth';

const STORAGE_KEY = 'xpense_impersonation_original';

interface DevImpersonateProps {
  currentUser: UserSession;
  setSession: (session: UserSession | null) => void;
}

export default function DevImpersonate({ currentUser, setSession }: DevImpersonateProps) {
  const [users, setUsers] = useState<{ userId: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const enabled = import.meta.env.VITE_DEV_IMPERSONATION === 'true';
  if (!enabled) return null;

  const loadUsers = async () => {
    setLoading(true);
    setUsers([]);
    try {
      const { data } = await axiosInstance.get<{
        users: Array<{ userId?: string; email?: string; UserID?: string; Email?: string }>;
      }>('/api/dev/users');
      const raw = data?.users ?? [];
      setUsers(
        raw.map((u) => ({
          userId: u.userId ?? u.UserID ?? '',
          email: u.email ?? u.Email ?? '',
        }))
      );
    } catch (err) {
      console.error('Failed to load users for impersonation', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (value: string) => {
    if (value === '__stop__') {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const original = JSON.parse(raw) as UserSession;
          sessionStorage.removeItem(STORAGE_KEY);
          setSession(original);
        }
      } catch {
        // ignore
      }
      return;
    }
    try {
      const { data } = await axiosInstance.post<{
        token: string;
        email: string;
        uid: string;
        role: string;
        displayName?: string;
        avatarUrl?: string;
        permissions?: string[];
      }>('/api/dev/impersonate', { userId: value });
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      setSession({
        email: data.email,
        uid: data.uid,
        name: data.email,
        displayName: data.displayName ?? data.email,
        picture: data.avatarUrl ?? '',
        role: data.role,
        token: data.token,
        permissions: data.permissions,
      });
    } catch (err) {
      console.error('Impersonate failed', err);
    }
  };

  const hasStored = typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem(STORAGE_KEY);
  const otherUsers = users.filter((u) => u.userId !== currentUser.uid);
  const options: { value: string; label: string }[] = [];
  if (hasStored) options.push({ value: '__stop__', label: 'Stop impersonating' });
  otherUsers.forEach((u) => {
    const label = u.email || u.userId || 'Unknown';
    if (u.userId) options.push({ value: u.userId, label });
  });

  return (
    <Select
      placeholder="Impersonate…"
      options={options}
      loading={loading}
      onDropdownVisibleChange={(open) => open && loadUsers()}
      onChange={handleSelect}
      value={undefined}
      allowClear
      className="min-w-[180px]"
      style={{ fontSize: 12 }}
      dropdownMatchSelectWidth={false}
      notFoundContent={loading ? 'Loading…' : (options.length === 0 ? 'No other users' : null)}
    />
  );
}
