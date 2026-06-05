"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Home, Search, Phone, Settings } from 'lucide-react';

export function BottomNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = useLocale();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    return pathname.startsWith(`/${locale}${path}`);
  };

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/search', label: t('nav.search'), icon: Search },
    { path: '/emergency', label: t('nav.emergency'), icon: Phone, isEmergency: true },
    { path: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <nav 
      role="navigation" 
      aria-label={t('accessibility.bottomNav')}
      className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center z-40 safe-area-bottom"
    >
      {navItems.map((item) => {
        const active = isActive(item.path);
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.path}
            href={`/${locale}${item.path === '/' ? '' : item.path}`}
            aria-current={active ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center justify-center min-h-[56px] h-full ${
              active ? 'text-emergency' : 'text-text-secondary'
            }`}
          >
            <Icon 
              className={`w-6 h-6 mb-1 ${item.isEmergency ? 'text-emergency' : ''}`} 
              aria-hidden="true" 
            />
            <span className={`text-[10px] font-medium ${item.isEmergency ? 'text-emergency' : ''}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
