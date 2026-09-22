import { describe, it, expect } from 'vitest';
import { extractLocation, extractTemporal, resolveContextFromMessages } from '../context';
import { UIMessage } from 'ai';

describe('AI Context Extraction', () => {
  it('extracts known cities', () => {
    expect(extractLocation('What is the weather in Pune?')).toBe('Pune');
    expect(extractLocation('Will it rain in Mumbai today?')).toBe('Mumbai');
    expect(extractLocation('Temp in delhi')).toBe('New Delhi');
  });

  it('extracts prepositions with unknown cities', () => {
    // Should return null if not in KNOWN_CITIES to maintain determinism
    expect(extractLocation('What is the weather in RandomCity?')).toBeNull();
  });

  it('extracts temporal references', () => {
    const baseDate = new Date('2026-09-12T12:00:00Z'); // Saturday
    expect(extractTemporal('today', baseDate)).toBe('2026-09-12');
    expect(extractTemporal('tomorrow', baseDate)).toBe('2026-09-13');
    expect(extractTemporal('day after tomorrow', baseDate)).toBe('2026-09-14');
    expect(extractTemporal('next wednesday', baseDate)).toBe('2026-09-16');
  });

  it('resolves full context from UIMessage array', () => {
    const UIMessages: UIMessage[] = [
      { role: 'user', id: '1', parts: [{ type: 'text' as const, text: 'What is the weather in Pune?' }] },
      { role: 'assistant', id: '2', parts: [{ type: 'text' as const, text: 'It is sunny in Pune.' }] },
      { role: 'user', id: '3', parts: [{ type: 'text' as const, text: 'What about tomorrow?' }] }
    ];

    const ctx = resolveContextFromMessages(UIMessages);
    expect(ctx.location).toBe('Pune'); // Inherited from previous UIMessage
    expect(ctx.intent).toBe('forecast'); // tomorrow = forecast
  });
});
