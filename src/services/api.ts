const API_BASE_URL = 'http://10.10.20.228:8080';

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  token?: string | null;
};

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const buildHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const apiRequest = async <T,>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: buildHeaders(options.token),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const rawText = await response.text();
  let payload: unknown = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    const errorMessage =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof (payload as {error?: unknown}).error === 'string'
        ? (payload as {error: string}).error
        : null;

    const message =
      errorMessage || `Erreur API (${response.status})`;

    throw new ApiError(message, response.status);
  }

  return payload as T;
};

export const getApiBaseUrl = () => API_BASE_URL;
