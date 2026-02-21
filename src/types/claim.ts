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
  aiAnalysis?: Record<string, unknown>;
  createdAt: string;
}

/** Request body for PATCH /api/claims/:id (draft fields + optional submit). */
export interface UpdateClaimDraftRequest {
  amount?: string;
  merchant?: string;
  category?: string;
  description?: string;
  expenseDate?: string;
  status?: string;
}

/** Request body for creating a claim (lowerCamelCase). */
export interface CreateClaimRequest {
  amount: string;
  merchant: string;
  category: string;
  description: string;
  receiptUrl?: string;
  expenseDate?: string;
}

/** Request body for updating claim status. */
export interface UpdateClaimStatusRequest {
  status: string;
  reason?: string;
}
