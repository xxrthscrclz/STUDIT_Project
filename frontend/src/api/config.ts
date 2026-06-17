const serverUrl = import.meta.env.VITE_SERVER_URL as string | undefined;

if (!serverUrl && !import.meta.env.DEV) {
  console.warn('[StudIt] VITE_SERVER_URL is not set. Falling back to http://000.00.0.00:8080');
}

/** Spring Boot API base URL (no trailing slash) */
export const API_BASE_URL = (serverUrl ?? 'http://000.00.0.00:8080').replace(/\/$/, '');

export const apiUrl = (path: string) => {
  const normalized = path.startsWith('/api')
    ? path
    : `/api${path.startsWith('/') ? path : `/${path}`}`;
  if (import.meta.env.DEV) {
    return normalized;
  }
  return `${API_BASE_URL}${normalized}`;
};
