"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Sun, Cpu, Activity } from 'lucide-react';

interface FormattedMessageProps {
  content: string;
  isUser: boolean;
}

// Inline helper to render bold markdown **text**
function renderMarkdownInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-sky-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function FormattedMessage({ content, isUser }: FormattedMessageProps) {
  if (isUser) {
    return <div className="text-white text-sm md:text-base leading-relaxed">{content}</div>;
  }

  // Split into lines for structured parsing
  const rawLines = content.split('\n');
  const lines = rawLines.map(l => l.trim()).filter(Boolean);

  // Check if this is a structured decision response
  const firstLine = lines[0] || '';
  const isDecisionResponse = firstLine.includes('RECOMMENDED') || 
                             firstLine.includes('FAVORABLE') || 
                             firstLine.includes('CAUTION') || 
                             firstLine.includes('UNFAVORABLE');

  if (!isDecisionResponse) {
    // Fallback standard markdown paragraph rendering
    return (
      <div className="space-y-3 text-sky-text-primary text-sm md:text-base leading-relaxed">
        {content.split('\n\n').map((paragraph, pIdx) => {
          const pLines = paragraph.split('\n');
          return (
            <div key={pIdx} className="space-y-1.5">
              {pLines.map((line, lIdx) => {
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={lIdx} className="text-lg font-bold text-sky-primary mt-2">
                      {renderMarkdownInline(line.replace('### ', '').replace(/\*\*/g, ''))}
                    </h3>
                  );
                }
                if (line.startsWith('• ') || line.startsWith('- ')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-2">
                      <span className="text-sky-primary mt-1">•</span>
                      <span>{renderMarkdownInline(line.replace(/^[•-]\s*/, ''))}</span>
                    </div>
                  );
                }
                return <p key={lIdx}>{renderMarkdownInline(line)}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // Parse structured decision response sections
  const decisionBadgeText = firstLine.replace(/###|\*\*/g, '').trim();
  let decisionType: 'success' | 'danger' | 'warning' | 'info' = 'info';

  if (decisionBadgeText.includes('NOT RECOMMENDED') || decisionBadgeText.includes('UNFAVORABLE')) {
    decisionType = 'danger';
  } else if (decisionBadgeText.includes('CAUTION')) {
    decisionType = 'warning';
  } else if (decisionBadgeText.includes('RECOMMENDED') || decisionBadgeText.includes('FAVORABLE')) {
    decisionType = 'success';
  }

  const sections: {
    answer?: string;
    reasoning: string[];
    actions: string[];
    confidence: string[];
    models: string[];
  } = {
    reasoning: [],
    actions: [],
    confidence: [],
    models: []
  };

  let currentSection: 'none' | 'reasoning' | 'actions' | 'confidence' = 'none';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('**ANSWER:**') || line.startsWith('**थेट उत्तर:**')) {
      sections.answer = line.replace(/^\*\*(?:ANSWER|थेट उत्तर):\*\*\s*/, '');
      currentSection = 'none';
      continue;
    }

    if (line.includes('METEOROLOGICAL REASONING') || line.includes('हवामान शास्त्रीय कारणे')) {
      currentSection = 'reasoning';
      continue;
    }

    if (line.includes('ACTIONABLE ADVICE') || line.includes('कृती सल्ला')) {
      currentSection = 'actions';
      continue;
    }

    if (line.includes('FORECAST CONFIDENCE') || line.includes('अंदाज खात्री')) {
      currentSection = 'confidence';
      continue;
    }

    if (currentSection === 'reasoning') {
      sections.reasoning.push(line);
    } else if (currentSection === 'actions') {
      sections.actions.push(line);
    } else if (currentSection === 'confidence') {
      if (line.includes('Ensemble Models:') || line.includes('मॉडेल तुलना:')) {
        sections.models.push(line);
      } else {
        sections.confidence.push(line);
      }
    }
  }

  return (
    <div className="space-y-4 text-sky-text-primary">
      {/* 1. Decision Status Badge */}
      <div className={cn(
        "inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-bold tracking-wide shadow-xs",
        decisionType === 'danger' && "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400",
        decisionType === 'warning' && "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
        decisionType === 'success' && "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
        decisionType === 'info' && "bg-sky-primary/15 border-sky-primary/30 text-sky-primary"
      )}>
        {decisionType === 'danger' && <XCircle className="h-4 w-4" />}
        {decisionType === 'warning' && <AlertTriangle className="h-4 w-4" />}
        {decisionType === 'success' && <CheckCircle2 className="h-4 w-4" />}
        {decisionType === 'info' && <Sun className="h-4 w-4" />}
        <span>{decisionBadgeText}</span>
      </div>

      {/* 2. Direct Answer Callout */}
      {sections.answer && (
        <div className="bg-sky-surface-elevated/60 border border-sky-border/80 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-sky-text-secondary uppercase tracking-wider block mb-1">
            Executive Summary
          </span>
          <p className="text-sm md:text-base font-medium text-sky-text-primary leading-relaxed">
            {renderMarkdownInline(sections.answer)}
          </p>
        </div>
      )}

      {/* 3. Meteorological Reasoning */}
      {sections.reasoning.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-text-secondary uppercase tracking-wider">
            <Activity className="h-3.5 w-3.5 text-sky-primary" />
            <span>Meteorological Reasoning & Thresholds</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {sections.reasoning.map((item, idx) => {
              const cleanItem = item.replace(/^[•-]\s*/, '');
              const isRed = cleanItem.includes('🔴');
              const isYellow = cleanItem.includes('🟡');
              const isGreen = cleanItem.includes('🟢');
              const textContent = cleanItem.replace(/[🔴🟡🟢]/g, '').trim();

              return (
                <div 
                  key={idx}
                  className="flex items-start gap-2.5 bg-sky-surface/40 border border-sky-border/50 rounded-lg p-2.5 text-xs md:text-sm"
                >
                  <span className="mt-0.5 shrink-0">
                    {isRed && <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block shadow-xs shadow-rose-500/50" />}
                    {isYellow && <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block shadow-xs shadow-amber-500/50" />}
                    {isGreen && <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block shadow-xs shadow-emerald-500/50" />}
                    {!isRed && !isYellow && !isGreen && <span className="text-sky-primary">•</span>}
                  </span>
                  <div className="leading-snug">
                    {renderMarkdownInline(textContent)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Actionable Advice & Next Steps */}
      {sections.actions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-text-secondary uppercase tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            <span>Actionable Advice & Next Steps</span>
          </div>
          <div className="space-y-2">
            {sections.actions.map((item, idx) => {
              const cleanItem = item.replace(/^[•-]\s*/, '').replace(/[📌⏱️]/g, '').trim();
              const isWindow = item.includes('Optimal Window') || item.includes('योग्य वेळ');

              return (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg p-2.5 text-xs md:text-sm border",
                    isWindow 
                      ? "bg-sky-primary/10 border-sky-primary/20 text-sky-primary font-semibold"
                      : "bg-sky-surface-elevated/40 border-sky-border/40 text-sky-text-primary"
                  )}
                >
                  <span className="mt-0.5 shrink-0">
                    {isWindow ? '⏱️' : '📌'}
                  </span>
                  <div className="leading-snug">
                    {renderMarkdownInline(cleanItem)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Forecast Confidence & Model Consensus */}
      {(sections.confidence.length > 0 || sections.models.length > 0) && (
        <div className="pt-2 border-t border-sky-border/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-sky-ai" />
              Multi-Model Forecast Consensus
            </span>
          </div>

          {sections.confidence.map((item, idx) => (
            <div key={idx} className="text-xs text-sky-text-secondary">
              {renderMarkdownInline(item.replace(/^[•-]\s*/, ''))}
            </div>
          ))}

          {/* Render individual model pills if present */}
          {sections.models.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {sections.models.flatMap((modelLine) => {
                const cleaned = modelLine.replace(/^[•-]\s*\*\*(?:Ensemble Models|मॉडेल तुलना):\*\*\s*/, '');
                return cleaned.split('|').map((part, mIdx) => {
                  const [modelName, ...valParts] = part.trim().split(':');
                  const val = valParts.join(':').trim();
                  return (
                    <div 
                      key={mIdx}
                      className="flex items-center gap-1.5 bg-sky-surface border border-sky-border/80 px-2.5 py-1 rounded-lg text-xs"
                    >
                      <span className="font-bold text-sky-text-primary">{modelName}</span>
                      <span className="text-sky-primary font-semibold">{val}</span>
                    </div>
                  );
                });
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
