import { UIMessage } from 'ai';
import { ResolvedContext, extractTextFromMessage } from './context';

export type AgentMode = 'general' | 'agriculture' | 'disaster' | 'research' | 'aviation' | 'marine' | 'urban';

export function routeMessage(messages: UIMessage[], context: ResolvedContext): AgentMode {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const lastUserMessage = lastUserMsg ? extractTextFromMessage(lastUserMsg).toLowerCase() : '';

  // 1. Aviation Check
  if (lastUserMessage.match(/\b(flight|airport|aviation|metar|taf|runway|crosswind|turbulence|icing|cloud ceiling)\b/)) {
    return 'aviation';
  }

  // 2. Marine Check
  if (lastUserMessage.match(/\b(marine|ocean|waves?|tides?|swell|sea|boat|sailing|offshore|coastal)\b/)) {
    return 'marine';
  }

  // 3. Agriculture Check
  if (lastUserMessage.match(/\b(farm|crop|spray|irrigation|agriculture|sow|harvest|pest|soil)\b/)) {
    return 'agriculture';
  }

  // 4. Disaster Check
  if (lastUserMessage.match(/\b(disaster|flood|cyclone|emergency|hurricane|tornado|extreme|risk|hazard)\b/)) {
    return 'disaster';
  }

  // 5. Research Check
  if (lastUserMessage.match(/\b(history|climate|past|record|era5|historical|trend)\b/) || lastUserMessage.match(/\b(19|20)\d{2}\b/) || context.intent === 'trends') {
    return 'research';
  }

  // 6. Urban Check
  if (lastUserMessage.match(/\b(commute|traffic|city|urban|heatwave|outdoor|pollution)\b/)) {
    return 'urban';
  }

  // Default to General
  return 'general';
}
