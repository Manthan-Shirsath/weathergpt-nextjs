import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';

// Ensure the keys are available in the server environment
const groqApiKey = process.env.GROQ_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

export const groq = createGroq({
  apiKey: groqApiKey || '',
});

export const openai = createOpenAI({
  apiKey: openaiApiKey || '',
});

// Default provider selection
export const primaryModel = groq('llama-3.3-70b-versatile'); // Standard fast groq model
export const fallbackModel = openai('gpt-4o-mini');
