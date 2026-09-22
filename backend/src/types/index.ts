// Global Types & Interfaces
export interface HealthResponse {
  success: boolean;
  service: string;
  status: string;
}

/** Standard envelope for all successful API responses */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

/** Standard envelope for all error API responses */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    stack?: string;
  };
  timestamp: string;
}

/** Pagination metadata for list endpoints */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Service health status for dependency checks */
export interface ServiceHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  lastChecked: string;
  details?: Record<string, unknown>;
}

export * from './pipelineStatus';

