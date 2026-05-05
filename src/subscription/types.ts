export type SubscriptionPlan = 'free' | 'pro';

export type ProFeature =
  | 'multipleBabies'
  | 'fullStats'
  | 'fullHistory'
  | 'notifications'
  | 'unlimitedDays';

export type ProPaywallReason =
  | 'multipleBabies'
  | 'fullStats'
  | 'fullHistory'
  | 'notifications'
  | 'unlimitedDays'
  | 'settings'
  | 'generic';

export type RestoreOutcome =
  | { status: 'restored' }
  | { status: 'no-purchases' }
  | { status: 'error'; message: string };

export type PurchaseOutcome =
  | { status: 'purchased' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export interface PriceInfo {
  monthly: string | null;
  yearly: string | null;
}
