import { DecisionResult } from './types';

export function generateDeterministicResponse(decision: DecisionResult, language = 'en'): string {
  const isMr = language === 'mr';

  const decisionBadge = {
    RECOMMENDED: isMr ? '✅ शिफारस केली आहे (RECOMMENDED)' : '✅ RECOMMENDED',
    CAUTION: isMr ? '⚠️ सावधगिरी बाळगा (PROCEED WITH CAUTION)' : '⚠️ PROCEED WITH CAUTION',
    NOT_RECOMMENDED: isMr ? '❌ शिफारस केलेली नाही (NOT RECOMMENDED)' : '❌ NOT RECOMMENDED',
    FAVORABLE: isMr ? '☀️ अनुकूल परिस्थिती (FAVORABLE)' : '☀️ FAVORABLE',
    UNFAVORABLE: isMr ? '🌧️ प्रतिकूल परिस्थिती (UNFAVORABLE)' : '🌧️ UNFAVORABLE'
  }[decision.decision];

  const confidenceBadge = {
    HIGH: isMr ? 'उच्च खात्री (High Confidence)' : 'High (Strong Model Agreement)',
    MEDIUM: isMr ? 'मध्यम खात्री (Moderate Agreement)' : 'Medium (Moderate Agreement)',
    LOW: isMr ? 'कमी खात्री / मॉडेल्समध्ये मतभेद (High Uncertainty)' : 'Low (Model Divergence Detected)'
  }[decision.confidence];

  // 1. ANSWER SECTION
  let response = `### **${decisionBadge}**\n\n`;
  response += `**${isMr ? 'थेट उत्तर' : 'ANSWER'}:** ${decision.summary}\n\n`;

  // 2. REASONS & METEOROLOGICAL THRESHOLDS
  response += `**${isMr ? 'हवामान शास्त्रीय कारणे' : 'METEOROLOGICAL REASONING'}:**\n`;
  for (const reason of decision.reasons) {
    const icon = reason.impact === 'critical' ? '🔴' : (reason.impact === 'warning' ? '🟡' : '🟢');
    response += `• ${icon} **${reason.factor}:** ${reason.value} (Standard threshold: ${reason.threshold})\n`;
  }
  response += '\n';

  // 3. ACTIONABLE RECOMMENDATIONS
  if (decision.actionable_advice.length > 0) {
    response += `**${isMr ? 'कृती सल्ला व पुढील पावले' : 'ACTIONABLE ADVICE & NEXT STEPS'}:**\n`;
    for (const advice of decision.actionable_advice) {
      response += `• 📌 ${advice}\n`;
    }
    if (decision.optimal_window) {
      response += `• ⏱️ **${isMr ? 'योग्य वेळ' : 'Optimal Window'}:** ${decision.optimal_window}\n`;
    }
    response += '\n';
  }

  // 4. FORECAST CONFIDENCE & MULTI-MODEL INTELLIGENCE
  const mi = decision.model_intelligence;
  response += `**${isMr ? 'मॉडेल एकमत व अंदाज खात्री' : 'FORECAST CONFIDENCE & MODEL CONSENSUS'}:**\n`;
  response += `• **${isMr ? 'एकमत गुण' : 'Consensus'}:** ${mi.consensus_score}% agreement (${confidenceBadge})\n`;

  const modelKeys = Object.keys(mi.model_values);
  if (modelKeys.length > 0) {
    const modelPairs = modelKeys
      .filter(k => mi.model_values[k] !== null && mi.model_values[k] !== undefined)
      .map(k => `${k}: ${mi.model_values[k]}%`)
      .join(' | ');
    if (modelPairs) {
      response += `• **${isMr ? 'मॉडेल तुलना' : 'Ensemble Models'}:** ${modelPairs}\n`;
    }
  }

  if (mi.divergent_models.length > 0) {
    response += `• ⚠️ **${isMr ? 'मतभेद' : 'Model Disagreement'}:** ${mi.divergent_models.join(', ')} diverges from the consensus.\n`;
  }

  return response;
}
