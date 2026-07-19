import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { SubscriptionProvider, useSubscription } from '../contexts/SubscriptionContext';

// Mock the api module
vi.mock('../lib/api', () => ({
  api: {
    getToken: () => null,
    request: vi.fn().mockRejectedValue(new Error('No token')),
  },
}));

describe('SubscriptionContext', () => {
  it('provides default subscription state', () => {
    const wrapper = ({ children }) => <SubscriptionProvider>{children}</SubscriptionProvider>;
    const { result } = renderHook(() => useSubscription(), { wrapper });

    expect(result.current.subscription).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('canUse returns a promise that resolves to true when no subscription', async () => {
    const wrapper = ({ children }) => <SubscriptionProvider>{children}</SubscriptionProvider>;
    const { result } = renderHook(() => useSubscription(), { wrapper });

    const allowed = await result.current.canUse('services');
    expect(allowed).toBe(true);
  });
});
