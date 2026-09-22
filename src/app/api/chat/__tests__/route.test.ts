import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/chat/route';

// Mock streamText to avoid real LLM calls
vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();
  return {
    ...actual,
    streamText: vi.fn(() => ({
      toUIMessageStreamResponse: () => new Response('Mocked streamed response', { status: 200 }),
      toTextStreamResponse: () => new Response('Mocked streamed response', { status: 200 }),
    }))
  };
});

describe('Chat API POST', () => {
  it('should run zero-LLM deterministic intelligence when no GROQ_API_KEY is present', async () => {
    delete process.env.GROQ_API_KEY;
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text' as const, text: 'What is the weather in Pune?' }] }]
      })
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('x-engine')).toBe('deterministic-multi-model');
    const text = await response.text();
    expect(text).toContain('text-delta');
  }, 15000);

  it('should resolve context and call streamText when GROQ_API_KEY is provided', async () => {
    process.env.GROQ_API_KEY = 'mock_groq_key';
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id: '1b', role: 'user', parts: [{ type: 'text' as const, text: 'What is the weather in Pune?' }] }]
      })
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe('Mocked streamed response');
    delete process.env.GROQ_API_KEY;
  });

  it('should route agricultural intent correctly', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id: '2', role: 'user', parts: [{ type: 'text' as const, text: 'What are the farming conditions in Nashik for cotton?' }] }]
      })
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
  });
  
  it('should handle tool errors gracefully', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id: '3', role: 'user', parts: [{ type: 'text' as const, text: 'Is there a flood risk in Mumbai?' }] }]
      })
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
  });
});
