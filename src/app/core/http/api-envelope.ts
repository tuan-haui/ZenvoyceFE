/** Khớp envelope JSON từ backend (ApiResponse). */
export interface ZenvoyceApiEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string | null;
  errors?: Record<string, string[] | null> | null;
}
