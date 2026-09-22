import { EngineInput, DecisionResult, DecisionFactor } from './types';

export function evaluateGeneralDecision(input: EngineInput): DecisionResult {
  const { query, weather, multiModel } = input;
  const targetDayIdx = Math.min(query.targetDateOffsetDays, weather.daily.length - 1);
  const dailyWeather = weather.daily[targetDayIdx] || weather.daily[0];
  const location = weather.location.city || query.location || 'Your Region';

  const rainProb = multiModel ? multiModel.rainProbability.consensus : (dailyWeather.daily_precipitation_probability ?? dailyWeather.rain_probability_pct ?? 0);
  const rainAmount = multiModel ? multiModel.precipitationAmount.consensus : (dailyWeather.precipitation_sum_mm ?? 0);
  const windSpeed = multiModel ? multiModel.windSpeed.consensus : (dailyWeather.wind_speed_max_kmh ?? 10);
  const maxTemp = multiModel ? multiModel.temperature.consensus : (dailyWeather.high_c ?? 28);
  const consensusScore = multiModel ? multiModel.overallConsensusScore : 85;
  const spreadLevel = multiModel ? multiModel.overallUncertainty : 'LOW';

  const reasons: DecisionFactor[] = [];
  const actionableAdvice: string[] = [];
  let decision: DecisionResult['decision'] = 'FAVORABLE';
  let riskLevel: DecisionResult['risk_level'] = 'LOW';
  let summary = '';

  if (query.intent === 'precipitation') {
    if (rainProb >= 60 || rainAmount >= 5.0) {
      decision = 'UNFAVORABLE';
      riskLevel = 'MODERATE';
      reasons.push({
        factor: 'Rain Probability',
        value: `${rainProb}%`,
        threshold: '> 50%',
        impact: 'critical'
      });
      reasons.push({
        factor: 'Expected Rain Amount',
        value: `${rainAmount} mm`,
        threshold: '> 5 mm',
        impact: 'critical'
      });
      actionableAdvice.push('Carry an umbrella or rain gear.');
      actionableAdvice.push('Expect wet roads and potential minor commute delays.');
      summary = `Yes, precipitation is highly likely in ${location} (${rainProb}% probability, ~${rainAmount} mm).`;
    } else if (rainProb >= 30) {
      decision = 'CAUTION';
      riskLevel = 'LOW';
      reasons.push({
        factor: 'Rain Probability',
        value: `${rainProb}%`,
        threshold: '30 - 50%',
        impact: 'warning'
      });
      actionableAdvice.push('Passing showers or scattered drizzle possible.');
      summary = `Moderate chance of scattered showers in ${location} (${rainProb}%).`;
    } else {
      decision = 'FAVORABLE';
      riskLevel = 'LOW';
      reasons.push({
        factor: 'Rain Probability',
        value: `${rainProb}%`,
        threshold: '< 30%',
        impact: 'positive'
      });
      actionableAdvice.push('Dry weather conditions expected. Outdoor plans can proceed without rain disruptions.');
      summary = `No significant rain expected in ${location} (only ${rainProb}% chance).`;
    }
  } else if (query.intent === 'flood_risk' || query.domain === 'disaster') {
    if (rainAmount >= 50 || (rainAmount >= 30 && rainProb >= 80)) {
      decision = 'NOT_RECOMMENDED';
      riskLevel = 'EXTREME';
      reasons.push({
        factor: 'Heavy Rainfall Accumulation',
        value: `${rainAmount} mm`,
        threshold: '> 30 mm',
        impact: 'critical'
      });
      actionableAdvice.push('Avoid low-lying areas, underpasses, and riverbanks.');
      actionableAdvice.push('Monitor local disaster management authority announcements.');
      summary = `HIGH FLOOD RISK: Severe precipitation forecast (${rainAmount} mm) in ${location}.`;
    } else {
      decision = 'FAVORABLE';
      riskLevel = 'LOW';
      reasons.push({
        factor: 'Precipitation Intensity',
        value: `${rainAmount} mm`,
        threshold: '< 30 mm',
        impact: 'positive'
      });
      actionableAdvice.push('No severe flood threat detected from current meteorological models.');
      summary = `No significant flood hazard indicated for ${location}.`;
    }
  } else if (query.intent === 'flight_conditions' || query.domain === 'aviation') {
    if (windSpeed > 35 || rainAmount > 15) {
      decision = 'UNFAVORABLE';
      riskLevel = 'HIGH';
      reasons.push({
        factor: 'Surface Wind / Gusts',
        value: `${windSpeed} km/h`,
        threshold: '> 35 km/h',
        impact: 'critical'
      });
      actionableAdvice.push('Expect possible runway crosswind turbulence or flight holding patterns.');
      summary = `Flight operations may experience weather-related disruption due to strong wind (${windSpeed} km/h).`;
    } else {
      decision = 'FAVORABLE';
      riskLevel = 'LOW';
      reasons.push({
        factor: 'Wind & Visibility Conditions',
        value: `Wind ${windSpeed} km/h`,
        threshold: '< 30 km/h',
        impact: 'positive'
      });
      actionableAdvice.push('General surface aviation parameters are within standard flight operational bounds.');
      summary = `Aviation weather conditions around ${location} appear favorable for scheduled operations.`;
    }
  } else {
    // Default summary
    reasons.push({
      factor: 'Temperature (High)',
      value: `${maxTemp}°C`,
      threshold: 'Standard',
      impact: 'positive'
    });
    reasons.push({
      factor: 'Rain Probability',
      value: `${rainProb}%`,
      threshold: 'Standard',
      impact: rainProb > 50 ? 'warning' : 'positive'
    });
    actionableAdvice.push('Enjoy your day and check hourly updates for local shifts.');
    summary = `Forecast for ${location}: ${dailyWeather.condition}, temperature peaking around ${maxTemp}°C with ${rainProb}% rain probability.`;
  }

  const modelValues: Record<string, number | null | undefined> = {};
  if (multiModel) {
    modelValues['ECMWF Rain Prob'] = multiModel.rainProbability.models.ecmwf;
    modelValues['GFS Rain Prob'] = multiModel.rainProbability.models.gfs;
    modelValues['ICON Rain Prob'] = multiModel.rainProbability.models.icon;
  }

  return {
    domain: query.domain,
    intent: query.intent,
    targetDate: multiModel?.targetDateStr || dailyWeather.date,
    timeWindowLabel: multiModel?.timeWindowLabel || (query.timeRange?.label || 'full day'),
    location,
    decision,
    risk_level: riskLevel,
    confidence: spreadLevel === 'HIGH' ? 'LOW' : (spreadLevel === 'MODERATE' ? 'MEDIUM' : 'HIGH'),
    summary,
    reasons,
    actionable_advice: actionableAdvice,
    model_intelligence: {
      consensus_score: consensusScore,
      spread_level: spreadLevel,
      rain_probability_consensus: rainProb,
      wind_speed_consensus: windSpeed,
      temperature_consensus: maxTemp,
      model_values: modelValues,
      divergent_models: multiModel?.divergentModels || []
    }
  };
}
