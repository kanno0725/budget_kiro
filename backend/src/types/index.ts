export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

export interface TransactionFilters extends PaginationQuery, DateRangeQuery {
  category?: string;
  type?: 'INCOME' | 'EXPENSE';
}