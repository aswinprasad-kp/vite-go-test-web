import useSWR from 'swr';
import { axiosInstance } from '../core-utils/axiosInstance';
import type { PaginatedResponse } from '../core-utils/types/pagination';
import type { Claim } from '../types/claim';

const CLAIMS_BASE = '/api/claims';

/** status: '' | 'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'disbursed' */
function claimsKey(page: number, pageSize: number, status: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status && status !== 'all') params.set('status', status);
  return `${CLAIMS_BASE}?${params.toString()}`;
}

async function fetcher(url: string): Promise<PaginatedResponse<Claim>> {
  const { data } = await axiosInstance.get<PaginatedResponse<Claim>>(url);
  return (
    data ?? {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    }
  );
}

/** SWR hook for listing claims with backend pagination and optional status filter. */
export function useClaims(page: number, pageSize: number, status: string = '') {
  const key = claimsKey(page, pageSize, status);
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Claim>>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 60_000,
  });
  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    error,
    isLoading,
    mutate,
  };
}
