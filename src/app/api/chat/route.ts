import { streamText, UIMessage, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { primaryModel } from '@/ai/provider';
import { resolveContextFromMessages, buildContextSystemString, extractTextFromMessage } from '@/ai/context';
import { routeMessage, type AgentMode } from '@/ai/router';
import { agentConfigurations, getAgentTools } from '@/ai/agents';
import { getScenarioById } from '@/lib/expert-scenarios/registry';
import { analyzeScenario } from '@/lib/expert-scenarios/analyzers';
import { weatherService } from '@/lib/weather/service';
import { parseNaturalQuery } from '@/lib/nlp/intent-extractor';
import { fetchDetailedMultiModelComparison } from '@/lib/weather/multi-model';
import { runDecisionEngine } from '@/lib/engines/decision-engine';
import { generateDeterministicResponse } from '@/lib/engines/response-generator';
import { fetchMarineForecast } from '@/lib/weather/marine';
import { parseCookieHeader } from '@/lib/location/store';

// Enforce nodejs runtime for compatibility with @upstash/redis and postgres drivers
export const runtime = 'nodejs';

async function handleDeterministicWeatherChat(
  userText: string,
  locationHint?: string,
  locationCoords?: { latitude: number; longitude: number; name: string },
  domainOverride?: string,
  language = 'en'
) {
  const defaultLoc = locationCoords?.name || locationHint || 'Pune';
  const parsed = parseNaturalQuery(userText, defaultLoc);
  if (domainOverride) {
    parsed.domain = domainOverride as any;
  }

  // Fetch weather data
  let weather;
  let lat = locationCoords?.latitude || 18.5204;
  let lon = locationCoords?.longitude || 73.8567;

  const targetLocationName = parsed.location || defaultLoc;
  try {
    weather = await weatherService.getWeatherForCity(targetLocationName);
    lat = weather.location.latitude;
    lon = weather.location.longitude;
  } catch {
    weather = await weatherService.getWeather(lat, lon, false, { name: targetLocationName });
  }

  // Fetch multi-model comparison
  const multiModel = await fetchDetailedMultiModelComparison(
    lat,
    lon,
    parsed.targetDateOffsetDays,
    parsed.timeRange
  );

  // Fetch specialized marine wave data if marine domain
  let marineData = null;
  if (parsed.domain === 'marine') {
    marineData = await fetchMarineForecast(lat, lon, parsed.targetDateOffsetDays);
  }

  // Run decision engine
  const decisionResult = runDecisionEngine({
    query: parsed,
    weather,
    multiModel,
    marineData
  });

  // Generate deterministic structured response
  const responseMarkdown = generateDeterministicResponse(decisionResult, language);

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: 'text-start', id: 'text-1' });
      // Stream in clean paragraph blocks for smooth UI animation
      const lines = responseMarkdown.split('\n');
      for (const line of lines) {
        writer.write({ type: 'text-delta', id: 'text-1', delta: line + '\n' });
      }
      writer.write({ type: 'finish' });
    }
  });

  return createUIMessageStreamResponse({
    stream,
    headers: {
      'x-engine': 'deterministic-multi-model',
      'x-decision': decisionResult.decision,
      'x-risk': decisionResult.risk_level,
      'x-consensus': `${decisionResult.model_intelligence.consensus_score}`
    }
  });
}

export async function POST(req: Request) {
  try {
    const { messages, language, domainOverride, scenarioId, location }: { 
      messages: UIMessage[], 
      language?: string, 
      domainOverride?: AgentMode,
      scenarioId?: string,
      location?: any
    } = await req.json();

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const lastUserText = lastUserMsg ? extractTextFromMessage(lastUserMsg) : '';

    const savedLocation = parseCookieHeader(req.headers.get('cookie'));

    const locationCity = typeof location === 'string'
      ? location
      : (location?.name || savedLocation?.name || 'Pune');
    const locationCoords = typeof location === 'object' && location && 'latitude' in location
      ? location
      : (savedLocation?.lat && savedLocation?.lon ? { latitude: savedLocation.lat, longitude: savedLocation.lon, name: savedLocation.name } : undefined);

    const hasGroqKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '');

    // 1. If NO LLM key is configured, instantly run the 100% deterministic intelligence engine
    if (!hasGroqKey) {
      return await handleDeterministicWeatherChat(
        lastUserText,
        locationCity,
        locationCoords,
        domainOverride,
        language
      );
    }

    // 2. If Groq Key is available, attempt LLM streaming with fallback to deterministic engine
    try {
      const context = resolveContextFromMessages(messages);
      let mode = domainOverride || routeMessage(messages, context);
      
      let scenarioEvidence = null;
      let scenarioSystemInstruction = '';

      if (scenarioId && locationCoords) {
        const scenario = getScenarioById(scenarioId);
        if (scenario) {
          mode = scenario.domain;
          const weather = await weatherService.getWeather(locationCoords.latitude, locationCoords.longitude, false, locationCoords);
          scenarioEvidence = analyzeScenario(scenario, weather, locationCoords);

          scenarioSystemInstruction = `
=== EXPERT SCENARIO EVIDENCE ===
You are providing an expert assessment for the following scenario:
Title: ${scenario.title}
Question: ${scenario.question}

DETERMINISTIC EVIDENCE (DO NOT FABRICATE):
${JSON.stringify(scenarioEvidence, null, 2)}
================================
`;
        }
      }

      const config = agentConfigurations[mode];
      const tools = getAgentTools(mode);
      const contextString = buildContextSystemString(context);
      let systemPrompt = `${contextString}\n\n${config.systemPrompt}\n\n${scenarioSystemInstruction}`;
      
      if (language === 'mr') {
        systemPrompt += `\n\nCRITICAL MULTILINGUAL RULE:\nProvide your entire response natively in Marathi. Translate all weather conditions, summaries, and advice into Marathi.`;
      } else {
        systemPrompt += `\n\nCRITICAL MULTILINGUAL RULE:\nProvide your response in English.`;
      }

      const modelMessages = await convertToModelMessages(messages);

      const result = streamText({
        model: primaryModel,
        messages: modelMessages,
        system: systemPrompt,
        tools
      });

      return result.toUIMessageStreamResponse({
        headers: {
          'x-engine': 'groq-llm',
          'x-scenario-evidence': scenarioEvidence ? JSON.stringify(scenarioEvidence) : ''
        }
      });
    } catch (llmError) {
      console.warn('⚠️ [LLM FAILOVER] External LLM error encountered, activating deterministic fallback:', llmError);
      return await handleDeterministicWeatherChat(
        lastUserText,
        locationCity,
        locationCoords,
        domainOverride,
        language
      );
    }
  } catch (error) {
    console.error('API Chat Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
