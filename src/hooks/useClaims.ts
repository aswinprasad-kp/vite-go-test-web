import useSWR from 'swr';
import { axiosInstance } from '../core-utils/axiosInstance';
import type { PaginatedResponse } from '../core-utils/types/pagination';
import type { Claim } from '../types/claim';

const CLAIMS_BASE = '/api/claims';

function claimsKey(page: number, pageSize: number) {
  return `${CLAIMS_BASE}?page=${page}&pageSize=${pageSize}`;
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

/** SWR hook for listing claims with backend pagination (uses proxy; requires auth). */
export function useClaims(page: number, pageSize: number) {
  const key = claimsKey(page, pageSize);
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
