import { UIMessage } from 'ai';

// Helper to extract text from a UIMessage
export function extractTextFromMessage(msg: UIMessage): string {
  if (!msg.parts) return '';
  const textParts = msg.parts.filter(p => p.type === 'text');
  return textParts.map(p => ('text' in p ? p.text : '')).join('\n');
}

const KNOWN_CITIES: Record<string, string> = {
  "pune": "Pune",
  "mumbai": "Mumbai",
  "bombay": "Mumbai",
  "delhi": "New Delhi",
  "new delhi": "New Delhi",
  "bengaluru": "Bengaluru",
  "bangalore": "Bengaluru",
  "chennai": "Chennai",
  "kolkata": "Kolkata",
  "hyderabad": "Hyderabad",
  "ahmedabad": "Ahmedabad",
  "jaipur": "Jaipur",
  "srinagar": "Srinagar",
  "surat": "Surat",
  "nagpur": "Nagpur",
  "nashik": "Nashik",
  "aurangabad": "Aurangabad",
  "chhatrapati sambhajinagar": "Aurangabad",
  "thane": "Thane",
  "goa": "Goa",
  "panaji": "Panaji",
  "lucknow": "Lucknow",
  "chandigarh": "Chandigarh",
  "bhopal": "Bhopal",
  "patna": "Patna",
  "kochi": "Kochi",
  "coimbatore": "Coimbatore",
  "shimla": "Shimla",
  "manali": "Manali",
  "guwahati": "Guwahati",
  "dehradun": "Dehradun"
};

export interface ResolvedContext {
  location: string | null;
  dateStr: string;
  intent: string;
}

export function extractLocation(text: string): string | null {
  const lowerText = text.toLowerCase();
  for (const [key, canon] of Object.entries(KNOWN_CITIES)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lowerText)) {
      return canon;
    }
  }
  
  // Basic preposition extraction (in/at/for/near)
  const prepMatch = text.match(/\b(?:in|at|for|around|near|to)\s+([A-Za-z]{3,20})\b/i);
  if (prepMatch) {
    const candidate = prepMatch[1].toLowerCase();
    if (KNOWN_CITIES[candidate]) {
      return KNOWN_CITIES[candidate];
    }
    // Return capitalized fallback if it looks like a proper noun, though less safe
    // We'll stick to known cities for strict deterministic behavior as in Python
  }
  
  return null;
}

export function extractTemporal(text: string, baseDate: Date = new Date()): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('day after tomorrow')) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }
  if (lowerText.includes('tomorrow') || lowerText.includes('tmrw')) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  if (lowerText.includes('today') || lowerText.includes('now') || lowerText.includes('tonight')) {
    return baseDate.toISOString().split('T')[0];
  }
  
  // Weekday checks
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (lowerText.includes(days[i])) {
      const currentDay = baseDate.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7;
      const target = new Date(baseDate);
      target.setDate(target.getDate() + diff);
      return target.toISOString().split('T')[0];
    }
  }
  
  // Default to today
  return baseDate.toISOString().split('T')[0];
}

export function deriveIntent(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('compare') || lowerText.includes('vs')) return 'comparison';
  if (lowerText.includes('play') || lowerText.includes('activity') || lowerText.includes('cricket') || lowerText.includes('football')) return 'activity_suitability';
  if (lowerText.includes('rain') || lowerText.includes('drizzle') || lowerText.includes('shower')) return 'rain_check';
  if (lowerText.includes('alert') || lowerText.includes('warning') || lowerText.includes('risk') || lowerText.includes('safe')) return 'alerts';
  if (lowerText.includes('trend') || lowerText.includes('history') || lowerText.includes('past')) return 'trends';
  if (lowerText.includes('tomorrow') || lowerText.includes('day after') || lowerText.includes('next')) return 'forecast';
  
  return 'current_weather';
}

export function resolveContextFromMessages(messages: UIMessage[]): ResolvedContext {
  if (!messages || messages.length === 0) {
    return { location: null, dateStr: new Date().toISOString().split('T')[0], intent: 'current_weather' };
  }
  
  // Go backwards through user messages to find the most recent explicit context
  let location: string | null = null;
  let dateStr: string | null = null;
  
  const userMessages = messages.filter(m => m.role === 'user');
  
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const msgText = extractTextFromMessage(userMessages[i]);
    
    if (msgText && !location) {
      location = extractLocation(msgText);
    }
  }
  
  // Date is mostly scoped to the latest message, but defaults to today
  const lastMsgStr = userMessages.length > 0 ? extractTextFromMessage(userMessages[userMessages.length - 1]) : '';
  
  dateStr = extractTemporal(lastMsgStr);
  const intent = deriveIntent(lastMsgStr);
  
  return {
    location,
    dateStr,
    intent
  };
}

export function buildContextSystemString(ctx: ResolvedContext): string {
  const parts = [];
  parts.push(`[ACTIVE CONTEXT]`);
  parts.push(`Location: ${ctx.location || 'Unknown (Ask User)'}`);
  parts.push(`Date: ${ctx.dateStr}`);
  parts.push(`Inferred Intent: ${ctx.intent}`);
  parts.push(`\nEnsure you use the available tools to answer based on this context. If the location is unknown, ask the user.`);
  
  return parts.join('\n');
}
