import useSWRMutation from 'swr/mutation';
import useSWR from 'swr';
import { axiosInstance } from '../core-utils/axiosInstance';
import type {
  Claim,
  CreateClaimRequest,
  UpdateClaimStatusRequest,
  UpdateClaimDraftRequest,
} from '../types/claim';

const CLAIMS_KEY = '/api/claims';

const fetcherClaim = (url: string) =>
  axiosInstance.get<Claim>(url).then((r) => r.data);

async function createClaim(_key: string, { arg }: { arg: CreateClaimRequest }) {
  const { data } = await axiosInstance.post<Claim>(CLAIMS_KEY, arg);
  return data;
}

async function updateClaimStatus(
  _key: string,
  { arg }: { arg: { claimId: string; body: UpdateClaimStatusRequest } }
) {
  const { data } = await axiosInstance.patch<Claim>(
    `${CLAIMS_KEY}/${arg.claimId}/status`,
    arg.body
  );
  return data;
}

export function useCreateClaim(onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(CLAIMS_KEY, createClaim, {
    onSuccess: () => {
      onSuccess?.();
    },
  });
  return { createClaim: trigger, isCreating: isMutating, createError: error };
}

export function useUpdateClaimStatus(onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(CLAIMS_KEY, updateClaimStatus, {
    onSuccess: () => {
      onSuccess?.();
    },
  });
  return {
    updateClaimStatus: (claimId: string, body: UpdateClaimStatusRequest) =>
      trigger({ claimId, body }),
    isUpdating: isMutating,
    updateError: error,
  };
}

/** Fetch a single claim (for refetch after AI fill). */
export function useGetClaim(claimId: string | null, options?: { refreshInterval?: number }) {
  const { data, error, mutate, isLoading } = useSWR<Claim>(
    claimId ? `${CLAIMS_KEY}/${claimId}` : null,
    fetcherClaim,
    { refreshInterval: options?.refreshInterval, revalidateOnFocus: false }
  );
  return { claim: data ?? null, error, mutate, isLoading };
}

async function updateClaimDraft(
  _key: string,
  { arg }: { arg: { claimId: string; body: UpdateClaimDraftRequest } }
) {
  const { data } = await axiosInstance.patch<Claim>(
    `${CLAIMS_KEY}/${arg.claimId}`,
    arg.body
  );
  return data;
}

export function useUpdateClaimDraft(onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(CLAIMS_KEY, updateClaimDraft, {
    onSuccess: () => {
      onSuccess?.();
    },
  });
  return {
    updateClaimDraft: (claimId: string, body: UpdateClaimDraftRequest) =>
      trigger({ claimId, body }),
    isUpdatingDraft: isMutating,
    updateDraftError: error,
  };
}

async function deleteClaim(_key: string, { arg }: { arg: string }) {
  await axiosInstance.delete(`${CLAIMS_KEY}/${arg}`);
}

export function useDeleteClaim(onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(CLAIMS_KEY, deleteClaim, {
    onSuccess: () => {
      onSuccess?.();
    },
  });
  return {
    deleteClaim: (claimId: string) => trigger(claimId),
    isDeleting: isMutating,
    deleteError: error,
  };
}
