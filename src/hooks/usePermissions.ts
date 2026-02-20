import useSWR from 'swr';
import { axiosInstance } from '../core-utils/axiosInstance';

const PERMISSIONS_KEY = '/api/auth/permissions';

interface PermissionsResponse {
  permissions: string[];
}

async function fetcher(url: string): Promise<string[]> {
  const { data } = await axiosInstance.get<PermissionsResponse>(url);
  return data?.permissions ?? [];
}

/**
 * Fetches current user's permissions from GET /api/auth/permissions.
 * Call when layout loads; do not rely on login-stored permissions (not trusted for gating).
 * Refetches when layout mounts / revalidates so URL changes get fresh permissions.
 */
export function usePermissions() {
  const { data, error, isLoading, mutate } = useSWR<string[]>(PERMISSIONS_KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateIfStale: true,
    dedupingInterval: 0,
  });
  return {
    permissions: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
