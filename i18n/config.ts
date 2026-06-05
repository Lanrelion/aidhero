export const locales = ['en', 'ha', 'ig', 'yo', 'pcm'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en';
