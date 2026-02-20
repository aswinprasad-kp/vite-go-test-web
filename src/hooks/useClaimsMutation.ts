import useSWRMutation from 'swr/mutation';
import { axiosInstance } from '../core-utils/axiosInstance';
import type { Claim, CreateClaimRequest, UpdateClaimStatusRequest } from '../types/claim';

const CLAIMS_KEY = '/api/claims';

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
