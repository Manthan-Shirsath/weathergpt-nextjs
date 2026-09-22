"use client";

import React from 'react';
import { Bell, Settings } from 'lucide-react';
import { Button } from '@heroui/react';
import { LocationSearch } from '@/components/location/LocationSearch';
import { Sparkles } from 'lucide-react';

import { LanguageSelector } from './LanguageSelector';

export function Header() {
  return (
    <header className="h-20 bg-sky-surface/80 backdrop-blur-2xl border-b border-sky-border flex items-center justify-between px-4 lg:px-10 z-10 shrink-0 sticky top-0 transition-colors duration-300">
      {/* Mobile logo */}
      <div className="flex items-center lg:hidden">
        <div className="bg-linear-to-tr from-sky-primary to-sky-ai p-1.5 rounded-lg shadow-sm mr-2">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-sky-text-primary">WeatherGPT</span>
      </div>

      {/* Desktop search bar */}
      <div className="hidden lg:flex flex-1 items-center gap-6 max-w-md">
        <LocationSearch placeholder="Search locations..." className="w-full" />
      </div>

      <div className="flex items-center gap-3">
        <LanguageSelector className="hidden sm:flex" />
        <Button variant="ghost" isIconOnly className="hidden sm:inline-flex relative rounded-full hover:bg-sky-surface-elevated transition-transform hover:scale-105 text-sky-text-primary border-0" aria-label="Notifications">
          <Bell className="h-5 w-5 text-sky-text-secondary" />
          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-sky-danger border-2 border-sky-surface animate-pulse" />
        </Button>

        <Button variant="ghost" isIconOnly className="rounded-full hover:bg-sky-surface-elevated transition-transform hover:scale-105 text-sky-text-primary border-0" aria-label="Settings">
          <Settings className="h-5 w-5 text-sky-text-secondary" />
        </Button>

        <div
          className="h-9 w-9 rounded-full bg-linear-to-tr from-sky-primary to-sky-ai flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 border-sky-surface"
          aria-label="User profile"
          role="button"
          tabIndex={0}
        >
          G
        </div>
      </div>
    </header>
  );
}
