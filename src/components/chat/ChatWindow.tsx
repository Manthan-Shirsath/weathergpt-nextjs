"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage, type TextUIPart, isToolUIPart } from 'ai';
import { ToolResultRenderer } from './ToolResultRenderer';
import { Button, Card } from '@heroui/react';
import { Sparkles, Send, User, Mic, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/context';
import { SCENARIOS } from '@/lib/expert-scenarios/registry';
import { ExpertScenario, ScenarioEvidence } from '@/lib/expert-scenarios/types';
import { FormattedMessage } from './FormattedMessage';

// Stable transport instance (created once, outside component)
const chatTransport = new DefaultChatTransport({ api: '/api/chat' });

export type AgentMode = 'general' | 'agriculture' | 'disaster' | 'research' | 'aviation' | 'marine' | 'urban';

export function ChatWindow() {
  const [input, setInput] = useState('');
  const [domainOverride, setDomainOverride] = useState<string>('');
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Extract city from URL
  const [city, setCity] = useState<string>('Pune');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('city')) setCity(params.get('city')!);
  }, []);

  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [evidenceList, setEvidenceList] = useState<{ id: string, evidence: ScenarioEvidence }[]>([]);

  const { messages, sendMessage, status, error } = useChat({
    transport: chatTransport,
    // @ts-expect-error - AI SDK types might not include body in this version but it works
    body: { 
      language, 
      domainOverride: domainOverride || undefined,
      scenarioId: activeScenarioId || undefined,
      location: city // Send city string as location
    },
    onResponse: (response: Response) => {
      const evidenceHeader = response.headers.get('x-scenario-evidence');
      if (evidenceHeader) {
        try {
          const evidence = JSON.parse(evidenceHeader);
          // Attach it to the most recent assistant message ID when it arrives
          setEvidenceList(prev => [...prev, { id: 'pending', evidence }]);
        } catch (e) {
          console.error('Failed to parse evidence header:', e);
        }
      }
    }
  });

  // When a new message comes in, update the pending evidence with the message ID
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        setEvidenceList(prev => prev.map(e => e.id === 'pending' ? { ...e, id: lastMessage.id } : e));
      }
    }
  }, [messages]);

  const isLoading = status === 'submitted' || status === 'streaming';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'mr' ? 'mr-IN' : 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInput(prev => prev ? `${prev} ${finalTranscript}` : finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in your browser.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setActiveScenarioId(null);
    sendMessage({ text: trimmed });
    setInput('');
  };

  const handleScenarioClick = (scenario: ExpertScenario) => {
    if (isLoading) return;
    setActiveScenarioId(scenario.id);
    sendMessage({ text: scenario.question });
  };

  return (
    <div className="flex flex-col h-full bg-sky-background relative">
      {/* Top Agent Switcher & Zero-LLM Status Bar */}
      <div className="border-b border-sky-border/60 bg-sky-surface/80 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
          <span className="text-[11px] font-bold text-sky-text-secondary uppercase tracking-wider mr-1 hidden sm:inline">Agent:</span>
          <button
            type="button"
            onClick={() => setDomainOverride('')}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
              !domainOverride 
                ? "bg-sky-primary text-white shadow-xs" 
                : "text-sky-text-secondary hover:text-sky-text-primary hover:bg-sky-surface-elevated"
            )}
          >
            🤖 All Agents (Auto-NLP)
          </button>
          {Object.keys(t.domains).map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => setDomainOverride(domain === domainOverride ? '' : domain)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                domainOverride === domain
                  ? "bg-sky-primary text-white shadow-xs"
                  : "text-sky-text-secondary hover:text-sky-text-primary hover:bg-sky-surface-elevated"
              )}
            >
              {t.domains[domain as keyof typeof t.domains]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Zap className="h-3 w-3" />
            <span>Deterministic Intelligence (Active)</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-70 space-y-4 pt-10">
            <div className="bg-linear-to-tr from-sky-primary to-sky-ai p-4 rounded-3xl shadow-glow">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-sky-text-primary">{t.chat.greetingTitle}</h2>
            <p className="text-sky-text-secondary text-center max-w-sm mb-6">
              {t.chat.greetingSubtitle}
            </p>
            
            <div className="flex flex-col items-center gap-2 w-full max-w-md">
              <span className="text-xs font-semibold text-sky-text-secondary uppercase tracking-wider">{t.chat.domainSelector}</span>
              <div className="flex flex-wrap justify-center gap-2">
                {(Object.keys(t.domains)).map(domain => (
                  <Button
                    key={domain}
                    size="sm"
                    variant={domainOverride === domain ? "primary" : "outline"}
                    className={cn(
                      "rounded-full transition-all text-xs font-medium",
                      domainOverride === domain ? "bg-sky-primary text-white shadow-md" : "bg-sky-surface-elevated text-sky-text-secondary hover:bg-sky-surface-elevated/80"
                    )}
                    onPress={() => setDomainOverride(domain === domainOverride ? '' : domain)}
                  >
                    {t.domains[domain as keyof typeof t.domains]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Natural Language Prompts */}
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl mt-4">
              {[
                "Should I spray pesticides tomorrow morning in Nashik?",
                "Will it rain in Pune between 9 AM and 4 PM?",
                "Do I need to irrigate cotton today in Nagpur?",
                "Is there any flood hazard for Mumbai today?"
              ].map((promptText, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (!isLoading) sendMessage({ text: promptText });
                  }}
                  className="text-xs bg-sky-surface-elevated/70 border border-sky-border/80 hover:border-sky-primary/60 text-sky-text-secondary hover:text-sky-primary px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  💬 &quot;{promptText}&quot;
                </button>
              ))}
            </div>
            
            <div className="w-full max-w-4xl mt-8">
              <h3 className="text-sm font-semibold text-sky-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Ask a SkyCast Expert
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SCENARIOS.filter(s => domainOverride ? s.domain === domainOverride : true).slice(0, 6).map((scenario) => (
                  <Card 
                    key={scenario.id} 
                    className="bg-sky-surface border border-sky-border hover:border-sky-primary/50 transition-all text-left shadow-sm hover:shadow-md cursor-pointer"
                    onClick={() => handleScenarioClick(scenario)}
                  >
                    <div className="flex gap-3 px-4 pt-4 pb-2">
                      <div className="text-2xl">{scenario.icon}</div>
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-sky-text-primary">{scenario.title}</p>
                      </div>
                    </div>
                    <div className="px-4 pb-4 pt-0">
                      <p className="text-xs text-sky-text-secondary line-clamp-2">&quot;{scenario.question}&quot;</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m: UIMessage, messageIndex: number) => {
          const isLatestUserMessage = m.role === 'user' && messageIndex === messages.length - 2;
          
          return (
          <div
            key={m.id}
            className={cn(
              'flex gap-4 max-w-4xl mx-auto',
              m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <div
              className={cn(
                'shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm',
                m.role === 'user'
                  ? 'bg-sky-surface border border-sky-border'
                  : 'bg-linear-to-tr from-sky-primary to-sky-ai'
              )}
            >
              {m.role === 'user' ? (
                <User className="h-5 w-5 text-sky-text-secondary" />
              ) : (
                <Sparkles className="h-5 w-5 text-white" />
              )}
            </div>

            <div
              className={cn(
                'flex flex-col gap-3 max-w-[85%]',
                m.role === 'user' ? 'items-end' : 'items-start'
              )}
            >
              {m.parts.map((part, idx) => {
                if (part.type === 'text') {
                  const textPart = part as TextUIPart;
                  if (!textPart.text) return null;
                  return (
                    <div key={`text-${idx}`} className="group relative w-full">
                      <div
                        className={cn(
                          'px-5 py-4 rounded-2xl shadow-sm leading-relaxed',
                          m.role === 'user'
                            ? 'bg-sky-primary text-white rounded-tr-sm'
                            : 'bg-sky-surface border border-sky-border text-sky-text-primary rounded-tl-sm w-full'
                        )}
                      >
                        <FormattedMessage content={textPart.text} isUser={m.role === 'user'} />
                      </div>
                      {m.role !== 'user' && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-sky-text-secondary hover:text-sky-primary"
                          onPress={() => {
                            if ('speechSynthesis' in window) {
                              window.speechSynthesis.cancel();
                              const utterance = new SpeechSynthesisUtterance(textPart.text);
                              utterance.lang = language === 'mr' ? 'mr-IN' : 'en-US';
                              window.speechSynthesis.speak(utterance);
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                        </Button>
                      )}
                    </div>
                  );
                }

                if (isToolUIPart(part)) {
                  return (
                    <div key={`tool-${idx}`} className="w-full">
                      <ToolResultRenderer part={part} />
                    </div>
                  );
                }

                return null;
              })}

              {/* Render Evidence if this is the assistant message right after the user scenario question */}
              {m.role !== 'user' && (
                <div className="mt-2 w-full">
                  {evidenceList.filter(e => e.id === m.id).map((item, i) => {
                    const evidence = item.evidence;
                    if (!evidence) return null;
                    return (
                      <div key={i} className="bg-sky-surface-elevated border border-sky-border rounded-xl p-4 text-sm mt-2 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-sky-border/50">
                          <Activity className="h-4 w-4 text-sky-primary" />
                          <span className="font-semibold text-sky-text-primary uppercase tracking-wider text-xs">Deterministic Evidence ({evidence.domain})</span>
                          <span className={cn(
                            "ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest",
                            evidence.severity === 'HIGH' || evidence.severity === 'EXTREME' ? "bg-red-500/20 text-red-500" :
                            evidence.severity === 'ELEVATED' ? "bg-amber-500/20 text-amber-500" :
                            evidence.severity === 'LOW' ? "bg-green-500/20 text-green-500" : "bg-sky-text-secondary/20 text-sky-text-secondary"
                          )}>{evidence.severity} SEVERITY</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          {evidence.factors.map((f, idx) => (
                            <div key={idx} className="flex flex-col">
                              <span className="text-xs text-sky-text-secondary">{f.name}</span>
                              <span className="text-sky-text-primary font-medium">{f.value} <span className="text-xs opacity-70 ml-1">({f.interpretation})</span></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )})}

        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === 'user' && (
            <div className="flex gap-4 max-w-4xl mx-auto flex-row">
              <div className="shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm bg-linear-to-tr from-sky-primary to-sky-ai animate-pulse">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="px-5 py-3 rounded-2xl shadow-sm bg-sky-surface border border-sky-border rounded-tl-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-sky-text-secondary rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-sky-text-secondary rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="w-2 h-2 bg-sky-text-secondary rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            </div>
          )}

        {error && (
          <div className="max-w-4xl mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-sm font-medium">
            An error occurred: {error.message}
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="p-4 md:p-6 bg-sky-background border-t border-sky-border shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
          <input
            className="w-full bg-sky-surface-elevated border border-sky-border rounded-full pl-6 pr-24 py-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-primary/50 transition-all shadow-sm"
            value={input}
            placeholder={t.chat.placeholder}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <div className="absolute right-2 flex items-center gap-1">
            <Button
              isIconOnly
              variant="ghost"
              className={cn(
                "rounded-full transition-colors",
                isListening ? "bg-sky-danger/20 text-sky-danger animate-pulse" : "text-sky-text-secondary hover:text-sky-primary"
              )}
              onPress={toggleListening}
              isDisabled={isLoading}
            >
              <Mic className="h-5 w-5" />
            </Button>
            <Button
              isIconOnly
              type="submit"
              isDisabled={isLoading || !input.trim()}
              className="rounded-full bg-sky-primary text-white hover:bg-sky-primary-hover disabled:opacity-50"
            >
              <Send className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
