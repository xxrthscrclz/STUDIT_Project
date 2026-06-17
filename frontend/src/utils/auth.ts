export const TOKEN_KEY = 'studit_token';
export const MOCK_USER_KEY = 'studit_mock_user';

export type StoredMockUser = {
  id: number;
  username: string;
};

export function isMockToken(token: string | null | undefined): boolean {
  return Boolean(token?.startsWith('mock-'));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getMockUser(): StoredMockUser | null {
  const raw = localStorage.getItem(MOCK_USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredMockUser;
    if (typeof parsed.id === 'number' && typeof parsed.username === 'string') {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function setMockUser(user: StoredMockUser | null) {
  if (user) {
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(MOCK_USER_KEY);
  }
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    setMockUser(null);
  }
}

export function hasAuth(): boolean {
  return Boolean(getToken());
}
