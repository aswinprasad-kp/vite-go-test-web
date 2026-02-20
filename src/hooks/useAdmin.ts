import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { axiosInstance } from '../core-utils/axiosInstance';

const ADMIN = '/api/admin';

export interface Permission {
  id: string;
  key: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissionKeys: string[];
}

export interface UserWithRoles {
  userId: string;
  email: string;
  displayName: string;
  roleIds: string[];
}

// GET /api/admin/permissions
export function useAdminPermissions() {
  const { data, error, isLoading, mutate } = useSWR<{ permissions: Permission[] }>(
    `${ADMIN}/permissions`,
    (url: string) => axiosInstance.get(url).then((r) => r.data)
  );
  return {
    permissions: data?.permissions ?? [],
    error,
    isLoading,
    mutate,
  };
}

// GET /api/admin/roles
export function useAdminRoles() {
  const { data, error, isLoading, mutate } = useSWR<{ roles: Role[] }>(
    `${ADMIN}/roles`,
    (url: string) => axiosInstance.get(url).then((r) => r.data)
  );
  return {
    roles: data?.roles ?? [],
    error,
    isLoading,
    mutate,
  };
}

// POST /api/admin/roles
export function useCreateRole(onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    `${ADMIN}/roles`,
    async (_url, { arg }: { arg: { name: string; description?: string; permissionKeys?: string[] } }) => {
      const { data } = await axiosInstance.post<Role>(`${ADMIN}/roles`, arg);
      return data;
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { createRole: trigger, isCreating: isMutating, error };
}

// PATCH /api/admin/roles/:id
export function useUpdateRole(onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    `${ADMIN}/roles`,
    async (_url, { arg }: { arg: { roleId: string; name: string; description?: string } }) => {
      const { data } = await axiosInstance.patch<Role>(`${ADMIN}/roles/${arg.roleId}`, {
        name: arg.name,
        description: arg.description ?? '',
      });
      return data;
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { updateRole: trigger, isUpdating: isMutating, error };
}

// PUT /api/admin/roles/:id/permissions
export function useSetRolePermissions(onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    `${ADMIN}/roles`,
    async (_url, { arg }: { arg: { roleId: string; permissionKeys: string[] } }) => {
      await axiosInstance.put(`${ADMIN}/roles/${arg.roleId}/permissions`, {
        permissionKeys: arg.permissionKeys,
      });
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { setRolePermissions: trigger, isUpdating: isMutating, error };
}

// GET /api/admin/users
export function useAdminUsers() {
  const { data, error, isLoading, mutate } = useSWR<{ users: UserWithRoles[] }>(
    `${ADMIN}/users`,
    (url: string) => axiosInstance.get(url).then((r) => r.data)
  );
  return {
    users: data?.users ?? [],
    error,
    isLoading,
    mutate,
  };
}

// PUT /api/admin/users/:userId/roles
export function useSetUserRoles(onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    `${ADMIN}/users`,
    async (_url, { arg }: { arg: { userId: string; roleIds: string[] } }) => {
      await axiosInstance.put(`${ADMIN}/users/${arg.userId}/roles`, { roleIds: arg.roleIds });
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { setUserRoles: trigger, isUpdating: isMutating, error };
}
