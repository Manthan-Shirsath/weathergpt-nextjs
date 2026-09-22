import { ParsedQuery, DomainType, IntentType, TimeRange } from './types';

// Common Indian & major world cities for entity matching
const KNOWN_CITIES = [
  'mumbai', 'pune', 'nashik', 'nagpur', 'aurangabad', 'chhatrapati sambhajinagar',
  'delhi', 'new delhi', 'bengaluru', 'bangalore', 'hyderabad', 'chennai',
  'kolkata', 'ahmedabad', 'surat', 'jaipur', 'lucknow', 'kanpur', 'indore',
  'bhopal', 'patna', 'vadodara', 'ludhiana', 'agra', 'varanasi', 'kochi',
  'satara', 'kolhapur', 'solapur', 'amravati', 'nanded', 'jalgaon', 'akola',
  'london', 'new york', 'tokyo', 'paris', 'singapore', 'dubai'
];

const KNOWN_CROPS = [
  'cotton', 'wheat', 'rice', 'paddy', 'soybean', 'soya', 'grapes', 'grape',
  'onion', 'sugarcane', 'tomato', 'maize', 'corn', 'banana', 'mango',
  'chilli', 'potato', 'groundnut', 'pulses', 'gram', 'turmeric'
];

export function extractLocation(text: string): string | undefined {
  const lower = text.toLowerCase();

  // 1. Direct regex after prepositions: in, at, for, near, around
  const prepMatch = text.match(/\b(?:in|at|for|near|around)\s+([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)/);
  if (prepMatch && prepMatch[1]) {
    const candidate = prepMatch[1].trim();
    // Exclude temporal words that might follow prepositions like "in the morning"
    const stopWords = ['the morning', 'the afternoon', 'the evening', 'the night', 'tomorrow', 'today', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!stopWords.includes(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // 2. Scan known cities dictionary
  for (const city of KNOWN_CITIES) {
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(lower)) {
      // Capitalize first letter of each word
      return city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  // 3. Fallback: match capitalized word preceded by prepositions even if lowercased in input
  const prepFallback = lower.match(/\b(?:in|at|for|near|around)\s+([a-z]+(?:\s+[a-z]+)?)\b/);
  if (prepFallback && prepFallback[1]) {
    const candidate = prepFallback[1].trim();
    const stopWords = ['the', 'this', 'a', 'an', 'my', 'your', 'our', 'morning', 'afternoon', 'evening', 'night', 'tomorrow', 'today'];
    if (!stopWords.includes(candidate)) {
      return candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  }

  return undefined;
}

export function extractTemporal(text: string): { 
  targetDate: ParsedQuery['targetDate']; 
  offsetDays: number; 
  timeRange?: TimeRange 
} {
  const lower = text.toLowerCase();

  // Date offset calculation
  let targetDate: ParsedQuery['targetDate'] = 'today';
  let offsetDays = 0;

  if (/\b(?:day after tomorrow|overmorrow)\b/.test(lower)) {
    targetDate = 'day_after';
    offsetDays = 2;
  } else if (/\btomorrow\b/.test(lower)) {
    targetDate = 'tomorrow';
    offsetDays = 1;
  } else {
    // Check specific day of week
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = new Date().getDay();
    for (let i = 0; i < daysOfWeek.length; i++) {
      if (new RegExp(`\\b${daysOfWeek[i]}\\b`).test(lower)) {
        let diff = (i - currentDay + 7) % 7;
        if (diff === 0 && /\bnext\b/.test(lower)) diff = 7;
        if (diff > 0) {
          targetDate = diff === 1 ? 'tomorrow' : 'specific_date';
          offsetDays = diff;
          break;
        }
      }
    }
  }

  // Time range extraction
  let timeRange: TimeRange | undefined;

  // 1. Explicit range: "between 9 AM and 4 PM" or "from 10am to 2pm"
  const rangeMatch = lower.match(/\b(?:between|from)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:and|to|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (rangeMatch) {
    let startHour = parseInt(rangeMatch[1], 10);
    const startMeridiem = rangeMatch[3];
    let endHour = parseInt(rangeMatch[4], 10);
    const endMeridiem = rangeMatch[6] || startMeridiem;

    if (startMeridiem === 'pm' && startHour < 12) startHour += 12;
    if (startMeridiem === 'am' && startHour === 12) startHour = 0;
    if (endMeridiem === 'pm' && endHour < 12) endHour += 12;
    if (endMeridiem === 'am' && endHour === 12) endHour = 0;

    timeRange = {
      startHour: Math.min(Math.max(startHour, 0), 23),
      endHour: Math.min(Math.max(endHour, 0), 23),
      label: `${startHour}:00 - ${endHour}:00`
    };
  } else if (/\b(?:morning rush hour|morning commute)\b/.test(lower)) {
    timeRange = { startHour: 8, endHour: 10, label: 'morning rush hour (08:00 - 10:30)' };
  } else if (/\b(?:evening rush hour|evening commute)\b/.test(lower)) {
    timeRange = { startHour: 17, endHour: 20, label: 'evening rush hour (17:30 - 20:30)' };
  } else if (/\bmorning\b/.test(lower)) {
    timeRange = { startHour: 6, endHour: 12, label: 'morning (06:00 - 12:00)' };
  } else if (/\bafternoon\b/.test(lower)) {
    timeRange = { startHour: 12, endHour: 17, label: 'afternoon (12:00 - 17:00)' };
  } else if (/\bevening\b/.test(lower)) {
    timeRange = { startHour: 17, endHour: 21, label: 'evening (17:00 - 21:00)' };
  } else if (/\bnight\b/.test(lower)) {
    timeRange = { startHour: 21, endHour: 6, label: 'night (21:00 - 06:00)' };
  }

  return { targetDate, offsetDays, timeRange };
}

export function extractCrop(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const crop of KNOWN_CROPS) {
    if (new RegExp(`\\b${crop}s?\\b`).test(lower)) {
      return crop.charAt(0).toUpperCase() + crop.slice(1);
    }
  }
  return undefined;
}

export function extractIntentAndDomain(text: string): { domain: DomainType; intent: IntentType } {
  const lower = text.toLowerCase();

  // 1. Agriculture
  if (/\b(spray|spraying|pesticide|insecticide|fungicide|herbicide|chemical)\b/.test(lower)) {
    return { domain: 'agriculture', intent: 'spraying' };
  }
  if (/\b(irrigate|irrigation|water(?:ing)?|drip|sprinkler)\b/.test(lower)) {
    return { domain: 'agriculture', intent: 'irrigation' };
  }
  if (/\b(harvest|harvesting|cutting|reap)\b/.test(lower)) {
    return { domain: 'agriculture', intent: 'harvesting' };
  }
  if (/\b(sow|sowing|seed|planting)\b/.test(lower)) {
    return { domain: 'agriculture', intent: 'sowing' };
  }
  if (/\b(crop stress|frost|leaf burn|heat stress)\b/.test(lower)) {
    return { domain: 'agriculture', intent: 'heat_stress' };
  }
  if (/\b(farm|farmer|farming|agriculture|crop|soil)\b/.test(lower)) {
    return { domain: 'agriculture', intent: 'summary' };
  }

  // 2. Disaster
  if (/\b(flood|flooding|flash flood|waterlog|cyclone|hurricane|tornado|hazard|disaster|emergency|lightning|heatwave|inundation)\b/.test(lower)) {
    return { domain: 'disaster', intent: 'flood_risk' };
  }

  // 3. Aviation
  if (/\b(flight|airport|metar|taf|runway|crosswind|aircraft|aviation|pilot|vfr|ifr|mvfr|lifr|takeoff|landing|ceiling|turbulence)\b/.test(lower)) {
    return { domain: 'aviation', intent: 'flight_conditions' };
  }

  // 4. Marine
  if (/\b(boat|vessel|sea|ocean|wave|swell|marine|tide|coastal|sailing|fisherman|fishing|small craft|gale|surf|offshore)\b/.test(lower)) {
    return { domain: 'marine', intent: 'marine_safety' };
  }

  // 5. Urban
  if (/\b(commute|commuter|traffic|rush hour|metro|office|underpass|street|subway|outdoor)\b/.test(lower)) {
    return { domain: 'urban', intent: 'summary' };
  }

  // 6. General Weather
  if (/\b(rain|raining|precipitation|shower|drizzle|umbrella|downpour)\b/.test(lower)) {
    return { domain: 'general', intent: 'precipitation' };
  }
  if (/\b(temperature|temp|hot|heat|cold|warm|cool|degrees|celsius)\b/.test(lower)) {
    return { domain: 'general', intent: 'temperature' };
  }
  if (/\b(wind|windy|breeze|gust)\b/.test(lower)) {
    return { domain: 'general', intent: 'wind' };
  }

  return { domain: 'general', intent: 'summary' };
}

export function parseNaturalQuery(text: string, defaultLocation?: string): ParsedQuery {
  const location = extractLocation(text) || defaultLocation;
  const { targetDate, offsetDays, timeRange } = extractTemporal(text);
  const crop = extractCrop(text);
  const { domain, intent } = extractIntentAndDomain(text);

  let confidence = 0.85;
  if (!location) confidence -= 0.15;
  if (timeRange) confidence += 0.05;

  return {
    domain,
    intent,
    location,
    targetDate,
    targetDateOffsetDays: offsetDays,
    timeRange,
    crop,
    rawText: text,
    confidence: Math.min(Math.max(confidence, 0.5), 0.99)
  };
}
