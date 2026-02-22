/** One reimbursement recipient (group claims). */
export interface ReimbursementRecipient {
  userId: string;
  amount: string;
  email?: string;
  displayName?: string;
}

/** API claim shape (lowerCamelCase from backend). */
export interface Claim {
  id: string;
  userId: string;
  submitterEmail?: string;
  submitterDisplayName?: string;
  amount: string;
  merchant: string;
  category: string;
  description: string;
  status: string;
  receiptUrl: string;
  confidenceScore?: number;
  expenseDate?: string;
  statusReason?: string;
  needSupervision?: 'none' | 'low' | 'high';
  needLegalReview?: boolean;
  reimbursableAmount?: string;
  /** When AI receipt analysis fails (503, 429, etc.), backend stores { _aiError: { status, message } } here so FE can show it and stop polling. */
  aiAnalysis?: Record<string, unknown> & {
    _aiError?: { status: number; message: string };
  };
  createdAt: string;
  groupId?: string;
  teamId?: string;
  reimburseToUserId?: string;
  reimburseToUserEmail?: string;
  reimburseToUserDisplayName?: string;
  reimbursementRecipients?: ReimbursementRecipient[];
}

/** Request body for PATCH /api/claims/:id (draft fields + optional submit). Must match backend UpdateClaimDraftRequest. */
export interface UpdateClaimDraftRequest {
  amount?: string;
  merchant?: string;
  category?: string;
  description?: string;
  expenseDate?: string;
  status?: string;
  reimburseToUserId?: string;
  groupId?: string;
  teamId?: string;
  reimbursementRecipients?: ReimbursementRecipient[];
}

/** Request body for creating a claim (lowerCamelCase). */
export interface CreateClaimRequest {
  amount: string;
  merchant: string;
  category: string;
  description: string;
  receiptUrl?: string;
  expenseDate?: string;
  groupId?: string;
  teamId?: string;
  reimburseToUserId?: string;
  reimbursementRecipients?: ReimbursementRecipient[];
}

/** Request body for updating claim status. */
export interface UpdateClaimStatusRequest {
  status: string;
  reason?: string;
}
