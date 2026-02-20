import useSWR from 'swr';
import { axiosInstance } from '../core-utils/axiosInstance';

export interface ReportsSummary {
  statusCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  totalAmount: number;
  totalClaims: number;
  totalReimbursedAmount: number;
}

async function fetcher(url: string): Promise<ReportsSummary> {
  const { data } = await axiosInstance.get<ReportsSummary>(url);
  return data;
}

/** GET /api/reports/summary — aggregated stats for reports page (same scope as claims list). */
export function useReportsSummary() {
  const { data, error, isLoading, mutate } = useSWR<ReportsSummary>(
    '/api/reports/summary',
    fetcher,
    { revalidateOnFocus: false }
  );
  return { summary: data ?? null, error, isLoading, mutate };
}
