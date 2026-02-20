import useSWRMutation from 'swr/mutation';
import { axiosInstance } from '../core-utils/axiosInstance';

const CLAIMS_KEY = '/api/claims';

export interface UploadURLResponse {
  uploadUrl: string;
  path: string;
  token: string;
}

async function requestUploadUrl(
  _key: string,
  { arg }: { arg: { claimId: string; filename?: string } }
) {
  const { data } = await axiosInstance.post<UploadURLResponse>(
    `${CLAIMS_KEY}/${arg.claimId}/upload-url`,
    { filename: arg.filename ?? 'receipt' }
  );
  return data;
}

async function ackReceipt(
  _key: string,
  { arg }: { arg: { claimId: string; storagePath: string } }
) {
  await axiosInstance.post(`${CLAIMS_KEY}/${arg.claimId}/ack-receipt`, {
    storagePath: arg.storagePath,
  });
}

/** Upload file: signed URL (PUT + Bearer token) or local direct URL (POST + apikey). */
async function uploadToSignedUrl(
  uploadUrl: string,
  token: string,
  file: File
): Promise<void> {
  const isDirect = !token;
  const anonKey =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_SB_PUB_KEY
      ? String(import.meta.env.VITE_SB_PUB_KEY)
      : '';

  const res = await fetch(uploadUrl, {
    method: isDirect ? 'POST' : 'PUT',
    body: file,
    headers: {
      ...(isDirect && anonKey ? { apikey: anonKey } : { Authorization: `Bearer ${token}` }),
      'Content-Type': file.type || 'application/octet-stream',
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Upload failed: ${res.status} ${t}`);
  }
}

/**
 * One-shot: get upload URL, upload file to Storage, then ack. Call after creating a claim.
 */
export function useUploadReceiptForClaim(onSuccess?: () => void) {
  const { trigger: triggerUploadUrl } = useSWRMutation(
    CLAIMS_KEY,
    requestUploadUrl
  );
  const { trigger: triggerAck } = useSWRMutation(CLAIMS_KEY, ackReceipt, {
    onSuccess: () => onSuccess?.(),
  });

  const uploadReceipt = async (claimId: string, file: File): Promise<void> => {
    const { uploadUrl, path, token } = await triggerUploadUrl({
      claimId,
      filename: file.name,
    });
    await uploadToSignedUrl(uploadUrl, token, file);
    await triggerAck({ claimId, storagePath: path });
  };

  return { uploadReceipt };
}

export function useRequestUploadUrl() {
  const { trigger, isMutating, error } = useSWRMutation(
    CLAIMS_KEY,
    requestUploadUrl
  );
  return {
    requestUploadUrl: trigger,
    isRequestingUrl: isMutating,
    requestError: error,
  };
}

export function useAckReceipt(onSuccess?: () => void) {
  const { trigger, isMutating, error } = useSWRMutation(CLAIMS_KEY, ackReceipt, {
    onSuccess: () => onSuccess?.(),
  });
  return {
    ackReceipt: (claimId: string, storagePath: string) =>
      trigger({ claimId, storagePath }),
    isAcking: isMutating,
    ackError: error,
  };
}
