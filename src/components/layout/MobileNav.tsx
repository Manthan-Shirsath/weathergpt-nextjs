"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useLanguage } from '@/lib/i18n/context';

const NAV_ITEMS_DATA = [
  { key: 'dashboard', path: '/', icon: Home },
  { key: 'forecast', path: '/forecast-intelligence', icon: MapIcon },
  { key: 'chat', path: '/chat', icon: Sparkles },
  { key: 'map', path: '/map', icon: MapIcon },
];

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sky-surface/80 backdrop-blur-xl border-t border-sky-border pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS_DATA.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          const itemName = t.nav[item.key as keyof typeof t.nav] || item.key;
          
          return (
            <Link
              key={item.key}
              href={item.path}
              prefetch={true}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 relative",
                isActive 
                  ? "text-sky-primary" 
                  : "text-sky-text-secondary hover:text-sky-text-primary"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-sky-primary/10 rounded-2xl -z-10" />
              )}
              
              <Icon className={cn(
                "h-5 w-5 mb-1 transition-transform duration-300",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] font-medium tracking-wide transition-all duration-300",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {itemName}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
