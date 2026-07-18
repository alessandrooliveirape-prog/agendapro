import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface SubscriptionData {
  plan: string;
  plan_name: string;
  is_trial: boolean;
  is_expired: boolean;
  days_left: number;
  expires_at: string | null;
  trial_ends_at: string | null;
  features: string[];
  limits: {
    max_services: number;
    max_professionals: number;
    max_appointments_month: number;
  };
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  loading: boolean;
  refresh: () => Promise<void>;
  canUse: (feature: string) => Promise<boolean>;
  isPremium: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('agendapro_token');
      if (token) {
        loadSubscription();
      }
    } catch (e) {
      console.error('Erro init subscription:', e);
    }
  }, []);

  const loadSubscription = async () => {
    try {
      const token = localStorage.getItem('agendapro_token');
      if (!token) return;
      const data = await api.request<SubscriptionData>('/subscriptions/current');
      setSubscription(data);
    } catch (error) {
      // Ignorar erros silenciosamente
      setSubscription(null);
    }
  };

  const canUse = async (feature: string): Promise<boolean> => {
    try {
      const result = await api.request<{ allowed: boolean; reason?: string; message?: string }>(`/subscriptions/check-limit/${feature}`);
      return result.allowed;
    } catch {
      return true;
    }
  };

  const isPremium = subscription?.plan === 'pro' || subscription?.plan === 'business';

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, refresh: loadSubscription, canUse, isPremium }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
  return context;
}
