import { getLocales } from 'expo-localization';
import { en, type Translations } from './locales/en';
import { es } from './locales/es';

type Locale = 'en' | 'es';

const dictionaries: Record<Locale, Translations> = { en, es };

const resolveLocale = (): Locale => {
  const locales = getLocales();
  const code = locales[0]?.languageCode?.toLowerCase();
  return code === 'es' ? 'es' : 'en';
};

const currentLocale: Locale = resolveLocale();
const dict = dictionaries[currentLocale];

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : T[K] extends Record<string, unknown>
      ? Leaves<T[K], `${P}${K}.`>
      : never;
}[keyof T & string];

export type TranslationKey = Leaves<Translations>;

const resolve = (key: string): string => {
  const parts = key.split('.');
  let node: unknown = dict;
  for (const part of parts) {
    if (node && typeof node === 'object' && part in (node as object)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof node === 'string' ? node : key;
};

export const t = (
  key: TranslationKey,
  params?: Record<string, string | number>,
): string => {
  let value = resolve(key);
  if (params) {
    for (const [name, replacement] of Object.entries(params)) {
      value = value.replace(
        new RegExp(`\\{${name}\\}`, 'g'),
        String(replacement),
      );
    }
  }
  return value;
};

export const getLocale = (): Locale => currentLocale;
