"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Map as MapIcon, Sparkles, AlertTriangle, Sun, Moon, CloudSun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/context';

const NAV_ITEMS_DATA = [
  { key: 'dashboard', path: '/', icon: Home, shortcut: 'D' },
  { key: 'forecast', path: '/forecast-intelligence', icon: CloudSun, shortcut: 'F' },
  { key: 'chat', path: '/chat', icon: Sparkles, badge: '7 Agents', shortcut: 'C' },
  { key: 'map', path: '/map', icon: MapIcon, shortcut: 'M' },
  { key: 'alerts', path: '/alerts', icon: AlertTriangle, shortcut: 'A' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const { t } = useLanguage();

  const currentNavigating = navigatingTo === pathname ? null : navigatingTo;

  useEffect(() => {
    let mounted = true;
    const saved = localStorage.getItem('skycast_theme');
    const isDarkMode = saved
      ? saved === 'dark'
      : document.documentElement.classList.contains('dark');
    if (mounted) {
      setTimeout(() => setIsDark(isDarkMode), 0);
    }
    return () => { mounted = false; };
  }, []);

  // Global keyboard shortcuts: D, F, C, M, A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is focused inside an input, textarea, select, or editable element
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Ignore if modifier keys are active (Ctrl/Cmd, Alt, Meta)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      const shortcutMap: Record<string, string> = {
        d: '/',
        f: '/forecast-intelligence',
        c: '/chat',
        m: '/map',
        a: '/alerts',
      };

      const targetPath = shortcutMap[key];
      if (targetPath && targetPath !== pathname) {
        setNavigatingTo(targetPath);
        router.push(targetPath);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pathname, router]);

  const toggleTheme = () => {
    const root = document.documentElement;
    const isDarkMode = root.classList.contains('dark');
    
    if (isDarkMode) {
      root.classList.remove('dark');
      localStorage.setItem('skycast_theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('skycast_theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <aside className="hidden lg:flex w-60 xl:w-64 2xl:w-72 flex-col bg-sky-surface/60 backdrop-blur-2xl border-r border-sky-border z-20 transition-all duration-300">
      <div className="flex h-16 xl:h-18 items-center px-5 xl:px-6">
        <div className="bg-linear-to-tr from-sky-primary to-sky-ai p-1.5 xl:p-2 rounded-xl shadow-md mr-2.5 xl:mr-3">
          <Sparkles className="h-4 w-4 xl:h-5 xl:w-5 text-white" />
        </div>
        <div>
          <span className="text-lg xl:text-xl font-bold tracking-tight text-sky-text-primary">WeatherGPT</span>
          <span className="block text-[9px] xl:text-[10px] text-sky-ai font-bold tracking-[0.2em] uppercase -mt-0.5">Agentic Intelligence</span>
        </div>
      </div>
      
      <nav className="space-y-1 px-2.5 xl:px-3 flex-1 overflow-y-auto py-3 xl:py-4">
        {NAV_ITEMS_DATA.map((item) => {
          const isActive = pathname === item.path;
          const isNavigating = currentNavigating === item.path;
          const Icon = item.icon;
          const itemName = t.nav[item.key as keyof typeof t.nav] || item.key;
          return (
            <Link
              key={item.key}
              href={item.path}
              prefetch={true}
              onClick={() => {
                if (pathname !== item.path) {
                  setNavigatingTo(item.path);
                }
              }}
              className={cn(
                "group relative flex items-center justify-between px-3 py-2 xl:px-3.5 xl:py-2.5 rounded-xl text-xs xl:text-sm font-medium transition-all duration-300 overflow-hidden",
                isActive 
                  ? "text-sky-primary shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                  : "text-sky-text-secondary hover:text-sky-text-primary hover:bg-sky-surface-elevated/40"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-sky-primary/10 dark:bg-sky-primary/20 backdrop-blur-md rounded-xl -z-10" />
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-sky-primary rounded-r-full shadow-glow" />
              )}
              
              <div className="flex items-center">
                {isNavigating ? (
                  <div className="h-3.5 w-3.5 mr-2.5 rounded-full border-2 border-sky-primary border-t-transparent animate-spin" />
                ) : (
                  <Icon className={cn(
                    "h-4 w-4 mr-2.5 xl:mr-3 transition-transform duration-300", 
                    isActive ? "text-sky-primary scale-110" : "text-sky-text-secondary group-hover:text-sky-text-primary group-hover:scale-110"
                  )} />
                )}
                <span className="tracking-wide">{itemName}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[9px] xl:text-[10px] font-bold uppercase tracking-wider shadow-xs",
                    item.badge === 'AI' ? "bg-sky-ai/10 text-sky-ai" : "bg-sky-primary/10 text-sky-primary"
                  )}>
                    {item.badge}
                  </span>
                )}
                <kbd className="hidden group-hover:inline-block px-1 py-0.2 rounded text-[9px] xl:text-[10px] font-mono text-sky-text-secondary bg-sky-surface-elevated border border-sky-border shadow-2xs">
                  {item.shortcut}
                </kbd>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 xl:p-4">
         <button onClick={toggleTheme} className="flex w-full items-center justify-between px-3 py-2 xl:px-3.5 xl:py-2.5 text-xs xl:text-sm text-sky-text-secondary hover:text-sky-text-primary rounded-xl hover:bg-sky-surface-elevated/60 transition-all duration-300 group border border-transparent hover:border-sky-border cursor-pointer">
            <span className="font-semibold tracking-wide">Toggle Theme</span>
            <div className="bg-sky-surface-elevated p-1 xl:p-1.5 rounded-lg group-hover:shadow-xs transition-all">
              {isDark ? <Sun className="h-3.5 w-3.5 xl:h-4 xl:w-4 text-amber-500" /> : <Moon className="h-3.5 w-3.5 xl:h-4 xl:w-4 text-sky-primary" />}
            </div>
         </button>
      </div>
    </aside>
  );
}
