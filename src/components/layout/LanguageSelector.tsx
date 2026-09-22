"use client";

import React from 'react';
import { Button } from '@heroui/react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

export function LanguageSelector({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={cn("flex items-center gap-1 bg-sky-surface-elevated/50 p-1 rounded-full border border-sky-border/50 backdrop-blur-sm", className)}>
      <Globe className="h-4 w-4 text-sky-text-secondary ml-2 mr-1 shrink-0" />
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          "h-7 px-3 min-w-0 rounded-full font-medium transition-colors text-xs border-0",
          language === 'en' 
            ? "bg-sky-primary text-white shadow-sm hover:bg-sky-primary" 
            : "text-sky-text-secondary hover:text-sky-text-primary"
        )}
        onPress={() => setLanguage('en')}
      >
        EN
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          "h-7 px-3 min-w-0 rounded-full font-medium transition-colors text-xs border-0",
          language === 'mr' 
            ? "bg-sky-primary text-white shadow-sm hover:bg-sky-primary" 
            : "text-sky-text-secondary hover:text-sky-text-primary"
        )}
        onPress={() => setLanguage('mr')}
      >
        मराठी
      </Button>
    </div>
  );
}
