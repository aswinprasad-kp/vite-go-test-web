/** API claim shape (lowerCamelCase from backend). */
export interface Claim {
  id: string;
  userId: string;
  amount: string;
  merchant: string;
  category: string;
  description: string;
  status: string;
  receiptUrl: string;
  confidenceScore?: number;
  createdAt: string;
}

/** Request body for creating a claim (lowerCamelCase). */
export interface CreateClaimRequest {
  amount: string;
  merchant: string;
  category: string;
  description: string;
  receiptUrl?: string;
}

/** Request body for updating claim status. */
export interface UpdateClaimStatusRequest {
  status: string;
}
