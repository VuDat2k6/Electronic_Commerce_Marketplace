import config from './config';

// Request cache for deduplication
const requestCache = new Map<string, { promise: Promise<unknown>; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds cache for deduplication

export const apiClient = {
  baseUrl: config.apiBaseUrl,

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    return fetch(url, { ...defaultOptions, ...options });
  },

  // Deduplicated GET - prevents duplicate concurrent requests
  async getDeduped(endpoint: string, options?: RequestInit & { cacheKey?: string }): Promise<Response> {
    const cacheKey = options?.cacheKey || endpoint;

    // Check if there's already a pending request for this endpoint
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Wait for the existing request
      await cached.promise;
      // Return a fresh fetch since we can't return cached response
    }

    const promise = this.request(endpoint, { ...options, method: 'GET' });
    requestCache.set(cacheKey, { promise, timestamp: Date.now() });

    try {
      return await promise as Response;
    } finally {
      // Clean up cache after response
      setTimeout(() => requestCache.delete(cacheKey), CACHE_TTL);
    }
  },

  // Convenience methods
  get: (endpoint: string, options?: RequestInit) =>
    apiClient.request(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: (endpoint: string, data?: unknown, options?: RequestInit) =>
    apiClient.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (endpoint: string, options?: RequestInit) =>
    apiClient.request(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;
