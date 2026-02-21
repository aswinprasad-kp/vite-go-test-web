import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { axiosInstance } from '../core-utils/axiosInstance';

const TEAMS = '/api/teams';

export interface Team {
  id: string;
  name: string;
  description?: string;
  leaderId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  teamId: string;
  userId: string;
  email?: string;
  joinedAt?: string;
}

export function useTeams() {
  const { data, error, isLoading, mutate } = useSWR<{ teams: Team[] }>(
    TEAMS,
    (url: string) => axiosInstance.get(url).then((r) => r.data)
  );
  return {
    teams: data?.teams ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useTeam(teamId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Team>(
    teamId ? `${TEAMS}/${teamId}` : null,
    (url: string) => axiosInstance.get(url).then((r) => r.data)
  );
  return {
    team: data ?? null,
    error,
    isLoading,
    mutate,
  };
}

export function useTeamMembers(teamId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ members: TeamMember[] }>(
    teamId ? `${TEAMS}/${teamId}/members` : null,
    (url: string) => axiosInstance.get(url).then((r) => r.data)
  );
  return {
    members: data?.members ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useCreateTeam(onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    TEAMS,
    async (_url, { arg }: { arg: { name: string; description?: string } }) => {
      const { data } = await axiosInstance.post<Team>(TEAMS, arg);
      return data;
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { createTeam: trigger, isCreating: isMutating, error };
}

export function useUpdateTeam(teamId: string | null, onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    teamId ? `${TEAMS}/${teamId}` : null,
    async (url, { arg }: { arg: { name: string; description?: string } }) => {
      const { data } = await axiosInstance.patch<Team>(url!, arg);
      return data;
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { updateTeam: trigger, isUpdating: isMutating, error };
}

export function useAddTeamMember(teamId: string | null, onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    teamId ? `${TEAMS}/${teamId}/members` : null,
    async (url, { arg }: { arg: { email?: string; userId?: string } }) => {
      const body = arg.email != null ? { email: arg.email } : { userId: arg.userId };
      await axiosInstance.post(url!, body);
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { addMember: trigger, isAdding: isMutating, error };
}

export function useRemoveTeamMember(teamId: string | null, onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(
    teamId ? `${TEAMS}/${teamId}/members` : null,
    async (url, { arg }: { arg: { userId: string } }) => {
      await axiosInstance.delete(`${url}/${arg.userId}`);
    },
    { onSuccess: () => onSuccess?.() }
  );
  return { removeMember: trigger, isRemoving: isMutating, error };
}
