import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../lib/api';

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    api.setToken(null);
  });

  it('manages token in localStorage', () => {
    expect(api.getToken()).toBeNull();

    api.setToken('test-token-123');
    expect(api.getToken()).toBe('test-token-123');
    expect(localStorage.getItem('agendapro_token')).toBe('test-token-123');
  });

  it('removes token on logout', () => {
    api.setToken('test-token');
    api.logout();
    expect(localStorage.getItem('agendapro_token')).toBeNull();
  });

  it('returns null when no token stored', () => {
    expect(api.getToken()).toBeNull();
  });
});
