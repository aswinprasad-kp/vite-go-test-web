/** Default pagination request params (BE-friendly). */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** Paginated API response shape (lowerCamelCase). */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function defaultPagination(): PaginationParams {
  return { page: 1, pageSize: DEFAULT_PAGE_SIZE };
}
