import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { trackEvent } from '@/analytics/trackEvent';
import {
  CustomerInfo,
  PurchasesOffering,
  addCustomerInfoListener,
  fetchCustomerInfo,
  fetchOffering,
  getManagementURL,
  initRevenueCat,
  isRevenueCatAvailable,
  planFromCustomerInfo,
  pricesFromOffering,
  purchasePackageByIdentifier,
  restorePurchases as restorePurchasesRemote,
} from './revenueCat';
import { hasFeatureAccess } from './features';
import { useAuthStore } from '@/state/authStore';
import { isAdminEmail, useAdminStore } from '@/state/adminStore';
import type {
  PriceInfo,
  ProFeature,
  ProPaywallReason,
  SubscriptionPlan,
} from './types';

interface PaywallState {
  visible: boolean;
  reason: ProPaywallReason;
}

interface SubscriptionContextValue {
  plan: SubscriptionPlan;
  isPro: boolean;
  isLoading: boolean;
  error: string | null;
  prices: PriceInfo;
  paywall: PaywallState;
  hasAccess: (feature: ProFeature) => boolean;
  openPaywall: (reason: ProPaywallReason) => void;
  closePaywall: () => void;
  purchaseMonthly: () => Promise<void>;
  purchaseYearly: () => Promise<void>;
  restorePurchases: () => Promise<'restored' | 'no-purchases' | 'error'>;
  refreshCustomerInfo: () => Promise<void>;
  openManagement: () => Promise<string | null>;
}

const noop = () => {};
const asyncNoop = async () => {};

const defaultContext: SubscriptionContextValue = {
  plan: 'free',
  isPro: false,
  isLoading: true,
  error: null,
  prices: { monthly: null, yearly: null },
  paywall: { visible: false, reason: 'generic' },
  hasAccess: () => false,
  openPaywall: noop,
  closePaywall: noop,
  purchaseMonthly: asyncNoop,
  purchaseYearly: asyncNoop,
  restorePurchases: async () => 'error',
  refreshCustomerInfo: asyncNoop,
  openManagement: async () => null,
};

const SubscriptionContext = createContext<SubscriptionContextValue>(defaultContext);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<PriceInfo>({ monthly: null, yearly: null });
  const [paywall, setPaywall] = useState<PaywallState>({
    visible: false,
    reason: 'generic',
  });
  const offeringRef = useRef<PurchasesOffering | null>(null);

  const applyCustomerInfo = useCallback((info: CustomerInfo | null) => {
    const next = planFromCustomerInfo(info);
    setPlan(next);
    trackEvent('subscription_status_refreshed', { plan: next });
  }, []);

  const refreshCustomerInfo = useCallback(async () => {
    if (!isRevenueCatAvailable()) {
      setPlan('free');
      return;
    }
    const info = await fetchCustomerInfo();
    applyCustomerInfo(info);
  }, [applyCustomerInfo]);

  const refreshOffering = useCallback(async () => {
    if (!isRevenueCatAvailable()) {
      offeringRef.current = null;
      setPrices({ monthly: null, yearly: null });
      return;
    }
    const offering = await fetchOffering();
    offeringRef.current = offering;
    setPrices(pricesFromOffering(offering));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await initRevenueCat();
      if (cancelled) return;
      await Promise.all([refreshCustomerInfo(), refreshOffering()]);
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshCustomerInfo, refreshOffering]);

  useEffect(() => {
    const unsubscribe = addCustomerInfoListener((info) => {
      applyCustomerInfo(info);
    });
    return unsubscribe;
  }, [applyCustomerInfo]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshCustomerInfo().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [refreshCustomerInfo]);

  const openPaywall = useCallback((reason: ProPaywallReason) => {
    setPaywall({ visible: true, reason });
    trackEvent('paywall_viewed', { reason });
    trackEvent('pro_feature_blocked', { reason });
  }, []);

  const closePaywall = useCallback(() => {
    setPaywall((prev) => {
      if (prev.visible) trackEvent('paywall_closed', { reason: prev.reason });
      return { visible: false, reason: prev.reason };
    });
  }, []);

  const buy = useCallback(
    async (identifier: '$rc_monthly' | '$rc_annual') => {
      setError(null);
      trackEvent('purchase_started', { sku: identifier });
      const outcome = await purchasePackageByIdentifier(identifier);
      if (outcome.status === 'purchased') {
        trackEvent('purchase_completed', { sku: identifier });
        await refreshCustomerInfo();
        setPaywall((prev) => ({ ...prev, visible: false }));
      } else if (outcome.status === 'cancelled') {
        // user cancelled — stay quiet
      } else {
        trackEvent('purchase_failed', { sku: identifier, message: outcome.message });
        setError(outcome.message);
      }
    },
    [refreshCustomerInfo],
  );

  const purchaseMonthly = useCallback(async () => {
    trackEvent('paywall_monthly_tapped');
    await buy('$rc_monthly');
  }, [buy]);

  const purchaseYearly = useCallback(async () => {
    trackEvent('paywall_yearly_tapped');
    await buy('$rc_annual');
  }, [buy]);

  const restore = useCallback(async () => {
    setError(null);
    trackEvent('restore_started');
    const outcome = await restorePurchasesRemote();
    if (outcome.status === 'restored') {
      trackEvent('restore_completed', { result: 'restored' });
      await refreshCustomerInfo();
      setPaywall((prev) => ({ ...prev, visible: false }));
      return 'restored';
    }
    if (outcome.status === 'no-purchases') {
      trackEvent('restore_completed', { result: 'no-purchases' });
      return 'no-purchases';
    }
    trackEvent('restore_failed', { message: outcome.message });
    setError(outcome.message);
    return 'error';
  }, [refreshCustomerInfo]);

  const openManagement = useCallback(async () => {
    return getManagementURL();
  }, []);

  const userEmail = useAuthStore((s) => s.user?.email ?? null);
  const demoMode = useAdminStore((s) => s.demoMode);
  const isAdmin = isAdminEmail(userEmail);
  const effectivePlan: SubscriptionPlan = isAdmin
    ? demoMode
      ? 'free'
      : 'pro'
    : plan;

  const hasAccess = useCallback(
    (feature: ProFeature) => hasFeatureAccess(effectivePlan, feature),
    [effectivePlan],
  );

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      plan: effectivePlan,
      isPro: effectivePlan === 'pro',
      isLoading,
      error,
      prices,
      paywall,
      hasAccess,
      openPaywall,
      closePaywall,
      purchaseMonthly,
      purchaseYearly,
      restorePurchases: restore,
      refreshCustomerInfo,
      openManagement,
    }),
    [
      effectivePlan,
      isLoading,
      error,
      prices,
      paywall,
      hasAccess,
      openPaywall,
      closePaywall,
      purchaseMonthly,
      purchaseYearly,
      restore,
      refreshCustomerInfo,
      openManagement,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  );
};

export function useSubscription(): SubscriptionContextValue {
  return useContext(SubscriptionContext);
}
