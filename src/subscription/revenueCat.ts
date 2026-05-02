import {
  ENTITLEMENT_ID,
  OFFERING_ID,
  RC_ANNUAL_IDENTIFIER,
  RC_MONTHLY_IDENTIFIER,
  getRevenueCatApiKey,
  isRevenueCatRuntimeAvailable,
} from './config';
import type { PriceInfo, PurchaseOutcome, RestoreOutcome, SubscriptionPlan } from './types';

/**
 * Thin wrapper around `react-native-purchases`.
 *
 * The native module is loaded lazily so the app keeps running in Expo Go
 * (where the native module is missing) and falls back to a Free-plan mock
 * when no API key is configured. We type the SDK with a local minimal
 * surface so this file type-checks without `react-native-purchases`
 * being installed.
 */

interface Entitlement {
  isActive: boolean;
}
export interface CustomerInfo {
  entitlements?: { active?: Record<string, Entitlement | undefined> };
  managementURL?: string | null;
}
interface Product {
  priceString?: string;
}
interface PurchasesPackage {
  identifier: string;
  product?: Product;
}
export interface PurchasesOffering {
  identifier?: string;
  monthly?: PurchasesPackage | null;
  annual?: PurchasesPackage | null;
  availablePackages?: PurchasesPackage[];
}
interface Offerings {
  current?: PurchasesOffering | null;
  all?: Record<string, PurchasesOffering | undefined>;
}

interface PurchasesModule {
  configure: (cfg: { apiKey: string }) => Promise<void> | void;
  getCustomerInfo: () => Promise<CustomerInfo>;
  getOfferings: () => Promise<Offerings>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ customerInfo: CustomerInfo }>;
  restorePurchases: () => Promise<CustomerInfo>;
  addCustomerInfoUpdateListener: (cb: (info: CustomerInfo) => void) => void;
  removeCustomerInfoUpdateListener: (cb: (info: CustomerInfo) => void) => void;
  setLogLevel?: (level: unknown) => void;
  LOG_LEVEL?: { WARN?: unknown };
}

let cached: PurchasesModule | null | undefined;
let initialized = false;
let lastOffering: PurchasesOffering | null = null;

function loadPurchases(): PurchasesModule | null {
  if (cached !== undefined) return cached;
  if (!isRevenueCatRuntimeAvailable()) {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-purchases');
    cached = ((mod?.default ?? mod) as PurchasesModule) ?? null;
  } catch {
    cached = null;
  }
  return cached;
}

export function isRevenueCatAvailable(): boolean {
  return loadPurchases() !== null && getRevenueCatApiKey() !== null;
}

export async function initRevenueCat(): Promise<void> {
  if (initialized) return;
  const Purchases = loadPurchases();
  const apiKey = getRevenueCatApiKey();
  if (!Purchases || !apiKey) {
    initialized = true;
    return;
  }
  try {
    if (__DEV__ && Purchases.setLogLevel) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL?.WARN ?? 'warn');
    }
    await Purchases.configure({ apiKey });
    initialized = true;
  } catch (err) {
    if (__DEV__) console.warn('[RevenueCat] configure failed', err);
    initialized = true;
  }
}

export function planFromCustomerInfo(info: CustomerInfo | null | undefined): SubscriptionPlan {
  if (!info) return 'free';
  const entitlement = info.entitlements?.active?.[ENTITLEMENT_ID];
  return entitlement && entitlement.isActive ? 'pro' : 'free';
}

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  const Purchases = loadPurchases();
  if (!Purchases || !isRevenueCatAvailable()) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (err) {
    if (__DEV__) console.warn('[RevenueCat] getCustomerInfo failed', err);
    return null;
  }
}

export async function fetchOffering(): Promise<PurchasesOffering | null> {
  const Purchases = loadPurchases();
  if (!Purchases || !isRevenueCatAvailable()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const target = offerings?.all?.[OFFERING_ID] ?? offerings?.current ?? null;
    lastOffering = target ?? null;
    return lastOffering;
  } catch (err) {
    if (__DEV__) console.warn('[RevenueCat] getOfferings failed', err);
    return null;
  }
}

export function pricesFromOffering(offering: PurchasesOffering | null): PriceInfo {
  if (!offering) return { monthly: null, yearly: null };
  const monthly = offering.monthly ?? findPackage(offering, RC_MONTHLY_IDENTIFIER);
  const yearly = offering.annual ?? findPackage(offering, RC_ANNUAL_IDENTIFIER);
  return {
    monthly: monthly?.product?.priceString ?? null,
    yearly: yearly?.product?.priceString ?? null,
  };
}

function findPackage(
  offering: PurchasesOffering,
  identifier: string,
): PurchasesPackage | undefined {
  return offering.availablePackages?.find((p) => p.identifier === identifier);
}

export async function purchasePackageByIdentifier(
  identifier: '$rc_monthly' | '$rc_annual',
): Promise<PurchaseOutcome> {
  const Purchases = loadPurchases();
  if (!Purchases || !isRevenueCatAvailable()) {
    return { status: 'error', message: 'Compras no disponibles en este entorno.' };
  }
  const offering = lastOffering ?? (await fetchOffering());
  if (!offering) {
    return { status: 'error', message: 'No se pudo cargar el plan.' };
  }
  const pkg =
    identifier === '$rc_monthly'
      ? offering.monthly ?? findPackage(offering, identifier)
      : offering.annual ?? findPackage(offering, identifier);
  if (!pkg) {
    return { status: 'error', message: 'Plan no disponible.' };
  }
  try {
    await Purchases.purchasePackage(pkg);
    return { status: 'purchased' };
  } catch (err: unknown) {
    if (isUserCancelled(err)) return { status: 'cancelled' };
    return { status: 'error', message: errorMessage(err) };
  }
}

export async function restorePurchases(): Promise<RestoreOutcome> {
  const Purchases = loadPurchases();
  if (!Purchases || !isRevenueCatAvailable()) {
    return { status: 'error', message: 'Compras no disponibles en este entorno.' };
  }
  try {
    const info = await Purchases.restorePurchases();
    const plan = planFromCustomerInfo(info);
    return plan === 'pro' ? { status: 'restored' } : { status: 'no-purchases' };
  } catch (err) {
    return { status: 'error', message: errorMessage(err) };
  }
}

export function addCustomerInfoListener(
  cb: (info: CustomerInfo) => void,
): () => void {
  const Purchases = loadPurchases();
  if (!Purchases || !isRevenueCatAvailable()) return () => {};
  try {
    Purchases.addCustomerInfoUpdateListener(cb);
    return () => {
      try {
        Purchases.removeCustomerInfoUpdateListener(cb);
      } catch {
        // no-op
      }
    };
  } catch {
    return () => {};
  }
}

export async function getManagementURL(): Promise<string | null> {
  const info = await fetchCustomerInfo();
  return info?.managementURL ?? null;
}

function isUserCancelled(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as { userCancelled?: boolean; code?: string };
  return Boolean(anyErr.userCancelled) || anyErr.code === 'USER_CANCELLED';
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message?: unknown }).message ?? 'Algo salió mal.');
  }
  return 'Algo salió mal.';
}
