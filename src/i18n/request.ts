import { getRequestConfig } from 'next-intl/server';
import { locales, Locale, defaultLocale } from '../../i18n/config';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }
 
  return {
    locale,
    messages: (await import(`../../i18n/messages/${locale}.json`)).default
  };
});
