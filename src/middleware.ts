import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '../i18n/config';
import type { NextRequest } from 'next/server';

const handleI18nRouting = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default function middleware(req: NextRequest) {
  // Sync the preferred-language IDB value via the aidhero-lang cookie
  const cookieLocale = req.cookies.get('aidhero-lang')?.value;
  
  if (cookieLocale && locales.includes(cookieLocale as any)) {
    // next-intl expects NEXT_LOCALE by default
    req.cookies.set('NEXT_LOCALE', cookieLocale);
  }
  
  return handleI18nRouting(req);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - if they start with `/api`, `/_next` or `/_vercel`
    // - the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/'
  ]
};
