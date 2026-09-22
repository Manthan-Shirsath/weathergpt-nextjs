import { EngineInput, DecisionResult, DecisionFactor } from './types';

export function evaluateDisasterDecision(input: EngineInput): DecisionResult {
  const { query, weather, multiModel } = input;
  const targetDayIdx = Math.min(query.targetDateOffsetDays, weather.daily.length - 1);
  const dailyWeather = weather.daily[targetDayIdx] || weather.daily[0];
  const location = weather.location.city || query.location || 'Monitored Region';

  const rainProb = multiModel ? multiModel.rainProbability.consensus : (dailyWeather.daily_precipitation_probability ?? 0);
  const rainAmountMm = multiModel ? multiModel.precipitationAmount.consensus : (dailyWeather.precipitation_sum_mm ?? 0);
  const windSpeedKmh = multiModel ? multiModel.windSpeed.consensus : (dailyWeather.wind_speed_max_kmh ?? 10);
  const windGustsKmh = dailyWeather.wind_gusts_max_kmh || Math.round(windSpeedKmh * 1.4);
  const maxTemp = multiModel ? multiModel.temperature.consensus : (dailyWeather.high_c ?? 28);
  const weatherCode = dailyWeather.weather_code ?? weather.current.weather_code ?? 0;

  const reasons: DecisionFactor[] = [];
  const actionableAdvice: string[] = [];
  let decision: DecisionResult['decision'] = 'FAVORABLE';
  let riskLevel: DecisionResult['risk_level'] = 'LOW';
  let summary = '';

  // 1. FLASH FLOOD & HEAVY PRECIPITATION HAZARD (IMD Scientific Categories)
  const isExtremelyHeavyRain = rainAmountMm >= 115.6 || (rainAmountMm >= 64.5 && rainProb >= 85);
  const isHeavyRain = rainAmountMm >= 64.5 || (rainAmountMm >= 35.0 && rainProb >= 75);
  const isModerateRainRisk = rainAmountMm >= 20.0 || (rainAmountMm >= 10.0 && rainProb >= 70);

  // 2. CYCLONIC WIND SCALE (IMD / WMO Tropical Cyclone Guidelines)
  const isSevereCycloneWind = windSpeedKmh >= 89 || windGustsKmh >= 100;
  const isCyclonicWind = windSpeedKmh >= 62 || windGustsKmh >= 75;
  const isDepressionWind = windSpeedKmh >= 45;

  // 3. HEATWAVE CRITERIA (IMD Criteria: Plains >= 40°C, Coastal >= 37°C)
  const isHeatwave = maxTemp >= 40;

  // Evaluation Hierarchy
  if (isExtremelyHeavyRain || isSevereCycloneWind) {
    decision = 'NOT_RECOMMENDED';
    riskLevel = 'EXTREME';
    
    if (isExtremelyHeavyRain) {
      reasons.push({
        factor: 'IMD Red Alert Rainfall',
        value: `${rainAmountMm} mm (Probability: ${rainProb}%)`,
        threshold: 'Extremely Heavy (> 65 mm / > 115 mm)',
        impact: 'critical'
      });
      actionableAdvice.push('🚨 LIFE SAFETY HAZARD: High probability of catastrophic urban flash flooding and riverine inundation.');
      actionableAdvice.push('Evacuate ground-level basements and riverbanks; move emergency supplies to upper floors.');
      actionableAdvice.push('Avoid all travel: underpasses and arterial roads will experience severe waterlogging.');
    }
    if (isSevereCycloneWind) {
      reasons.push({
        factor: 'Cyclonic Storm Force Winds',
        value: `Sustained ${windSpeedKmh} km/h (Gusts to ${windGustsKmh} km/h)`,
        threshold: 'Severe Cyclone (> 89 km/h)',
        impact: 'critical'
      });
      actionableAdvice.push('Uprooting of large trees, disruption of electric power lines, and structural roof damage expected.');
      actionableAdvice.push('Remain indoors away from glass windows; secure exterior loose items immediately.');
    }
    summary = `RED ALERT DISASTER EMERGENCY in ${location}: Severe precipitation (${rainAmountMm} mm) and hazardous cyclonic winds (${windSpeedKmh} km/h).`;
  } else if (isHeavyRain || isCyclonicWind) {
    decision = 'NOT_RECOMMENDED';
    riskLevel = 'HIGH';
    
    if (isHeavyRain) {
      reasons.push({
        factor: 'IMD Orange Alert Rainfall',
        value: `${rainAmountMm} mm (${rainProb}% prob)`,
        threshold: 'Heavy Rain (> 35 - 65 mm)',
        impact: 'critical'
      });
      actionableAdvice.push('Expect localized stormwater drain surcharge and low-lying water stagnation.');
      actionableAdvice.push('Keep emergency flashlights and charged backup batteries ready.');
    }
    if (isCyclonicWind) {
      reasons.push({
        factor: 'High Gale Force Winds',
        value: `${windSpeedKmh} km/h (Gusts ${windGustsKmh} km/h)`,
        threshold: '> 62 km/h',
        impact: 'critical'
      });
      actionableAdvice.push('Risk of falling branches and flying debris. Suspend scaffolding and elevated work.');
    }
    summary = `ORANGE ALERT HAZARD for ${location}: Heavy rainfall and destructive wind gusts create significant municipal hazard.`;
  } else if (isModerateRainRisk || isDepressionWind || isHeatwave) {
    decision = 'CAUTION';
    riskLevel = 'MODERATE';
    
    if (isHeatwave) {
      reasons.push({
        factor: 'IMD Heatwave Criteria',
        value: `${maxTemp}°C`,
        threshold: '>= 40°C',
        impact: 'warning'
      });
      actionableAdvice.push('Severe heat stress alert: maintain hydration and avoid outdoor exertion between 11:30 AM and 04:00 PM.');
    }
    if (isModerateRainRisk) {
      reasons.push({
        factor: 'Moderate Precipitation Accumulation',
        value: `${rainAmountMm} mm`,
        threshold: '> 20 mm',
        impact: 'warning'
      });
      actionableAdvice.push('Slow road transit; potential minor water accumulation on unpaved roads.');
    }
    summary = `YELLOW WATCH for ${location}: Moderate environmental hazard detected. Proceed with heightened situational awareness.`;
  } else {
    decision = 'FAVORABLE';
    riskLevel = 'LOW';
    reasons.push({
      factor: 'Hydrological & Wind Risk',
      value: `Rain: ${rainAmountMm} mm, Wind: ${windSpeedKmh} km/h`,
      threshold: 'Benign baseline',
      impact: 'positive'
    });
    actionableAdvice.push('No severe weather warnings or disaster triggers active from numerical ensemble models.');
    summary = `DISASTER RISK LOW: Meteorological parameters for ${location} are within stable civil safety margins.`;
  }

  const modelValues: Record<string, number | null | undefined> = {};
  if (multiModel) {
    modelValues['ECMWF Rain Prob'] = multiModel.rainProbability.models.ecmwf;
    modelValues['GFS Rain Prob'] = multiModel.rainProbability.models.gfs;
    modelValues['ICON Rain Prob'] = multiModel.rainProbability.models.icon;
  }

  return {
    domain: 'disaster',
    intent: query.intent,
    targetDate: multiModel?.targetDateStr || dailyWeather.date,
    timeWindowLabel: multiModel?.timeWindowLabel || (query.timeRange?.label || 'full day'),
    location,
    decision,
    risk_level: riskLevel,
    confidence: multiModel?.overallUncertainty === 'HIGH' ? 'LOW' : 'HIGH',
    summary,
    reasons,
    actionable_advice: actionableAdvice,
    model_intelligence: {
      consensus_score: multiModel ? multiModel.overallConsensusScore : 90,
      spread_level: multiModel ? multiModel.overallUncertainty : 'LOW',
      rain_probability_consensus: rainProb,
      wind_speed_consensus: windSpeedKmh,
      temperature_consensus: maxTemp,
      model_values: modelValues,
      divergent_models: multiModel?.divergentModels || []
    }
  };
}
