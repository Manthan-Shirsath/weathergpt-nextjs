import { describe, it, expect } from 'vitest';
import { routeMessage } from '../router';
import { ResolvedContext } from '../context';

describe('AI Router', () => {
  const dummyContext: ResolvedContext = {
    location: 'Pune',
    dateStr: '2026-09-12',
    intent: 'current_weather'
  };

  it('routes to aviation for flight keywords', () => {
    const UIMessages = [{ role: 'user' as const, id: '1', parts: [{ type: 'text' as const, text: 'What is the flight weather?' }] }];
    expect(routeMessage(UIMessages, dummyContext)).toBe('aviation');
  });

  it('routes to agriculture for crop keywords', () => {
    const UIMessages = [{ role: 'user' as const, id: '1', parts: [{ type: 'text' as const, text: 'Can I spray my crop today?' }] }];
    expect(routeMessage(UIMessages, dummyContext)).toBe('agriculture');
  });

  it('routes to disaster for flood keywords', () => {
    const UIMessages = [{ role: 'user' as const, id: '1', parts: [{ type: 'text' as const, text: 'Is there a flood risk?' }] }];
    expect(routeMessage(UIMessages, dummyContext)).toBe('disaster');
  });

  it('routes to marine for ocean keywords', () => {
    const UIMessages = [{ role: 'user' as const, id: '1', parts: [{ type: 'text' as const, text: 'What are the waves like?' }] }];
    expect(routeMessage(UIMessages, dummyContext)).toBe('marine');
  });

  it('routes to research for history keywords', () => {
    const UIMessages = [{ role: 'user' as const, id: '1', parts: [{ type: 'text' as const, text: 'What was the weather like in 1990?' }] }];
    expect(routeMessage(UIMessages, dummyContext)).toBe('research');
  });

  it('routes to urban for traffic keywords', () => {
    const UIMessages = [{ role: 'user' as const, id: '1', parts: [{ type: 'text' as const, text: 'How is the commute?' }] }];
    expect(routeMessage(UIMessages, dummyContext)).toBe('urban');
  });

  it('routes to general by default', () => {
    const UIMessages = [{ role: 'user' as const, id: '1', parts: [{ type: 'text' as const, text: 'What is the weather today?' }] }];
    expect(routeMessage(UIMessages, dummyContext)).toBe('general');
  });
});
