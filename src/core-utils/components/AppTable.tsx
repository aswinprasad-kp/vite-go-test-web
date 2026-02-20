import { Table } from 'antd';
import type { TableProps } from 'antd';
import type { PaginationParams } from '../types/pagination';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../types/pagination';

export interface AppTablePagination extends PaginationParams {
  total: number;
  onChange?: (page: number, pageSize: number) => void;
}

export interface AppTableProps<T> extends Omit<TableProps<T>, 'pagination'> {
  /** Use our pagination type; pass undefined for no pagination. */
  pagination?: AppTablePagination | false;
  /** Min width for horizontal scroll so columns don't wrap awkwardly. */
  scrollX?: number | true;
}

const DEFAULT_SCROLL_X = 900;

/**
 * Wrapper around Ant Design Table. Use this everywhere instead of AntD Table directly.
 * - Consistent scroll (horizontal) so columns don't wrap.
 * - Pagination wired to PaginationParams / backend-friendly defaults.
 * - Add more app-wide table behaviour here later.
 */
export default function AppTable<RecordType extends object>({
  scroll,
  pagination,
  scrollX,
  className = '',
  ...rest
}: AppTableProps<RecordType>) {
  const scrollConfig =
    scroll ??
    (scrollX !== undefined
      ? { x: scrollX === true ? DEFAULT_SCROLL_X : scrollX }
      : { x: DEFAULT_SCROLL_X });

  const paginationConfig =
    pagination === false
      ? false
      : {
          current: pagination?.page ?? 1,
          pageSize: pagination?.pageSize ?? DEFAULT_PAGE_SIZE,
          total: pagination?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showTotal: (total: number) => `Total ${total} items`,
          onChange: pagination?.onChange
            ? (page: number, pageSize: number) => pagination?.onChange?.(page, pageSize)
            : undefined,
        };

  return (
    <Table<RecordType>
      {...rest}
      scroll={scrollConfig}
      pagination={paginationConfig}
      className={`rounded border border-gray-200 ${className}`.trim()}
    />
  );
}
