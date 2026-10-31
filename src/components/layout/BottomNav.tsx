"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Home, Phone, Settings } from 'lucide-react';

export function BottomNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = useLocale();
  
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;

  const isActive = (path: string) => {
    if (path === '/') {
      return isHome;
    }
    return pathname.startsWith(`/${locale}${path}`);
  };

  const navItems = [
    { path: '/', label: t('nav.home') || 'Home', icon: Home },
    { path: '/emergency', label: t('nav.emergency') || 'Emergency', icon: Phone, isEmergency: true },
    { path: '/settings', label: t('nav.settings') || 'Settings', icon: Settings },
  ];

  if (pathname.endsWith('/onboarding')) {
    return null;
  }

  return (
    <nav 
      role="navigation" 
      aria-label={t('accessibility.bottomNav') || 'Bottom Navigation'}
      className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center z-40 safe-area-bottom shadow-card"
    >
      {navItems.map((item) => {
        const active = isActive(item.path);
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.path}
            href={`/${locale}${item.path === '/' ? '' : item.path}`}
            aria-current={active ? 'page' : undefined}
            className={`relative flex-1 flex flex-col items-center justify-center min-h-[56px] h-full transition-colors ${
              active ? 'text-emergency font-bold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {/* Active Tab Indicator: Thin 2px Emergency Red Line at Top of Tab */}
            {active && (
              <span 
                className="absolute top-0 inset-x-4 h-[2px] bg-emergency rounded-full" 
                aria-hidden="true" 
              />
            )}

            {/* Icon: Filled when active, Outline when inactive */}
            <Icon 
              className={`w-6 h-6 mb-0.5 transition-all ${
                active 
                  ? 'text-emergency fill-emergency' 
                  : item.isEmergency 
                  ? 'text-emergency fill-none' 
                  : 'fill-none'
              }`} 
              aria-hidden="true" 
            />
            
            <span className={`text-[11px] leading-tight ${item.isEmergency ? 'text-emergency font-bold' : ''}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
