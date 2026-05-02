export type AnalyticsEvent =
  | 'paywall_viewed'
  | 'paywall_closed'
  | 'paywall_monthly_tapped'
  | 'paywall_yearly_tapped'
  | 'purchase_started'
  | 'purchase_completed'
  | 'purchase_failed'
  | 'restore_started'
  | 'restore_completed'
  | 'restore_failed'
  | 'pro_feature_blocked'
  | 'subscription_status_refreshed';

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(event: AnalyticsEvent, props?: AnalyticsProps): void {
  if (__DEV__) {
    if (props) {
      console.log(`[analytics] ${event}`, props);
    } else {
      console.log(`[analytics] ${event}`);
    }
  }
}
