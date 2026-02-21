import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { axiosInstance } from '../core-utils/axiosInstance';

const GROUPS = '/api/groups';

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  email?: string;
  status: 'pending' | 'accepted';
  invitedBy: string;
  invitedAt?: string;
  respondedAt?: string;
}

export function useGroups() {
  const { data, error, isLoading, mutate } = useSWR<{ groups: Group[] }>(
    GROUPS,
    (url: string) => axiosInstance.get(url).then((r) => r.data)
  );
  return {
    groups: data?.groups ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useGroupInvites() {
  const { data, error, isLoading, mutate } = useSWR<{ invites: GroupMember[] }>(
    `${GROUPS}/invites`,
    (url: string) => axiosInstance.get(url).then((r) => r.data)
  );
  return {
    invites: data?.invites ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useGroup(groupId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Group>(
    groupId ? `${GROUPS}/${groupId}` : null,
    (url: string) => axiosInstance.get(url).then((r) => r.data)
  );
  return {
    group: data ?? null,
    error,
    isLoading,
    mutate,
  };
}

export function useGroupMembers(groupId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ members: GroupMember[] }>(
    groupId ? `${GROUPS}/${groupId}/members` : null,
    (url: string) => axiosInstance.get(url).then((r) => r.data)
  );
  return {
    members: data?.members ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useCreateGroup(onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    GROUPS,
    async (_url, { arg }: { arg: { name: string } }) => {
      const { data } = await axiosInstance.post<Group>(GROUPS, arg);
      return data;
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { createGroup: trigger, isCreating: isMutating, error };
}

export function useUpdateGroup(groupId: string | null, onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    groupId ? `${GROUPS}/${groupId}` : null,
    async (url, { arg }: { arg: { name: string } }) => {
      const { data } = await axiosInstance.patch<Group>(url!, arg);
      return data;
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { updateGroup: trigger, isUpdating: isMutating, error };
}

export function useAddGroupMember(groupId: string | null, onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    groupId ? `${GROUPS}/${groupId}/members` : null,
    async (url, { arg }: { arg: { userId?: string; email?: string } }) => {
      const body = arg.email != null ? { email: arg.email } : { userId: arg.userId };
      const { data } = await axiosInstance.post<GroupMember>(url!, body);
      return data;
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { addMember: trigger, isAdding: isMutating, error };
}

export function useAcceptGroupInvite(onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    GROUPS,
    async (_url, { arg }: { arg: { groupId: string } }) => {
      const { data } = await axiosInstance.post<GroupMember>(`${GROUPS}/${arg.groupId}/members/accept`, {});
      return data;
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { acceptInvite: trigger, isAccepting: isMutating, error };
}

export function useRejectGroupInvite(onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    GROUPS,
    async (_url, { arg }: { arg: { groupId: string } }) => {
      await axiosInstance.post(`${GROUPS}/${arg.groupId}/members/reject`, {});
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { rejectInvite: trigger, isRejecting: isMutating, error };
}

export function useRemoveGroupMember(groupId: string | null, onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    groupId ? `${GROUPS}/${groupId}/members` : null,
    async (url, { arg }: { arg: { userId: string } }) => {
      await axiosInstance.delete(`${url}/${arg.userId}`);
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { removeMember: trigger, isRemoving: isMutating, error };
}
