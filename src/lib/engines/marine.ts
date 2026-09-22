import { EngineInput, DecisionResult, DecisionFactor } from './types';

export function evaluateMarineDecision(input: EngineInput): DecisionResult {
  const { query, weather, multiModel, marineData } = input;
  const targetDayIdx = Math.min(query.targetDateOffsetDays, weather.daily.length - 1);
  const dailyWeather = weather.daily[targetDayIdx] || weather.daily[0];
  const location = weather.location.city || query.location || 'Coastal Waters';

  const windSpeedKmh = multiModel ? multiModel.windSpeed.consensus : (dailyWeather.wind_speed_max_kmh ?? 15);
  const windKnots = Math.round(windSpeedKmh * 0.539957);
  const rainProb = multiModel ? multiModel.rainProbability.consensus : (dailyWeather.daily_precipitation_probability ?? 0);

  // Sea State & Wave Data
  const waveHeightM = marineData?.isAvailable ? marineData.waveHeightMax : (windKnots > 20 ? 2.5 : 1.2);
  const swellPeriodS = marineData?.isAvailable ? marineData.swellWavePeriodAvg : 7.0;
  const seaState = marineData?.isAvailable ? marineData.seaState : (waveHeightM > 2.0 ? 'ROUGH' : 'SLIGHT');

  const reasons: DecisionFactor[] = [];
  const actionableAdvice: string[] = [];
  let decision: DecisionResult['decision'] = 'FAVORABLE';
  let riskLevel: DecisionResult['risk_level'] = 'LOW';
  let summary = '';

  // 1. GALE WARNING (Beaufort Force 8+: Wind >= 34 kt or Waves >= 3.5m)
  const isGaleWarning = windKnots >= 34 || waveHeightM >= 3.5;

  // 2. SMALL CRAFT ADVISORY (SCA: Wind >= 22 kt or Waves >= 2.0m)
  const isSmallCraftAdvisory = windKnots >= 22 || waveHeightM >= 2.0;

  // 3. GROUND SWELL & INLET HAZARD (Long period waves >= 11s)
  const isLongPeriodSwellHazard = swellPeriodS >= 11 && waveHeightM >= 1.5;

  if (isGaleWarning) {
    decision = 'NOT_RECOMMENDED';
    riskLevel = 'EXTREME';
    reasons.push({
      factor: 'Gale Warning Level Winds',
      value: `${windKnots} knots (${windSpeedKmh} km/h)`,
      threshold: 'Beaufort Force 8 (>= 34 kt)',
      impact: 'critical'
    });
    reasons.push({
      factor: 'Significant Wave Height',
      value: `${waveHeightM} meters (~${Math.round(waveHeightM * 3.28)} ft)`,
      threshold: '< 2.0 m safe limit',
      impact: 'critical'
    });
    actionableAdvice.push('🚨 GALE WARNING: All small craft, fishing trawlers, and recreational vessels must remain in port or seek immediate sheltered anchorage.');
    actionableAdvice.push('Breaking waves and severe green water over deck create life-threatening capsize risks.');
    summary = `GALE WARNING OFFSHORE ${location}: Violent sea state (${waveHeightM}m waves, ${windKnots} kt winds). Maritime operations NOT RECOMMENDED.`;
  } else if (isSmallCraftAdvisory) {
    decision = 'NOT_RECOMMENDED';
    riskLevel = 'HIGH';
    reasons.push({
      factor: 'Small Craft Advisory (SCA)',
      value: `Wave Height: ${waveHeightM} m (Sea State: ${seaState})`,
      threshold: 'SCA Limit: >= 2.0 m or >= 22 kt',
      impact: 'critical'
    });
    reasons.push({
      factor: 'Wind Speed',
      value: `${windKnots} knots (${windSpeedKmh} km/h)`,
      threshold: '< 20 kt',
      impact: 'warning'
    });
    actionableAdvice.push('Small Craft Advisory in effect: Vessels under 12 meters (39 ft) should postpone open-sea navigation.');
    actionableAdvice.push('Exercise extreme vigilance near harbor bars and shallow shoals due to steepening wave faces.');
    summary = `SMALL CRAFT ADVISORY active for ${location}: Wave heights reaching ${waveHeightM}m (${windKnots} kt winds). Small vessels should not venture offshore.`;
  } else if (isLongPeriodSwellHazard || windKnots >= 16) {
    decision = 'CAUTION';
    riskLevel = 'MODERATE';
    if (isLongPeriodSwellHazard) {
      reasons.push({
        factor: 'Long Period Groundswell',
        value: `${swellPeriodS}s swell period (${waveHeightM}m wave height)`,
        threshold: '< 10s period',
        impact: 'warning'
      });
      actionableAdvice.push('Heavy groundswell: Long period waves carry high kinetic energy, creating unexpected surge at river mouths and jetties.');
    }
    if (windKnots >= 16) {
      reasons.push({
        factor: 'Moderate Coastal Breeze',
        value: `${windKnots} knots (${windSpeedKmh} km/h)`,
        threshold: 'Moderate (11 - 16 kt)',
        impact: 'warning'
      });
      actionableAdvice.push('Moderate whitecaps and surface chop. Secure light topside gear on small boats.');
    }
    summary = `CAUTION ADVISED for coastal waters of ${location}: Moderate sea chop and energized swell present. Suitable for experienced mariners only.`;
  } else {
    decision = 'FAVORABLE';
    riskLevel = 'LOW';
    reasons.push({
      factor: 'Sea State',
      value: `${seaState} (Waves ~${waveHeightM}m)`,
      threshold: 'Favorable (< 1.5m)',
      impact: 'positive'
    });
    reasons.push({
      factor: 'Wind Speed',
      value: `${windKnots} knots (${windSpeedKmh} km/h)`,
      threshold: '< 15 kt',
      impact: 'positive'
    });
    actionableAdvice.push('Conditions are favorable for coastal fishing, recreational boating, and harbor operations.');
    actionableAdvice.push('Always maintain standard maritime VHF radio watch and wear lifejackets.');
    summary = `FAVORABLE MARINE CONDITIONS for ${location}: Smooth to slight seas (~${waveHeightM}m) and gentle coastal breeze (${windKnots} kt).`;
  }

  const modelValues: Record<string, number | null | undefined> = {};
  if (multiModel) {
    modelValues['ECMWF Wind (kt)'] = multiModel.windSpeed.models.ecmwf ? Math.round(multiModel.windSpeed.models.ecmwf * 0.539957) : null;
    modelValues['GFS Wind (kt)'] = multiModel.windSpeed.models.gfs ? Math.round(multiModel.windSpeed.models.gfs * 0.539957) : null;
    modelValues['ICON Wind (kt)'] = multiModel.windSpeed.models.icon ? Math.round(multiModel.windSpeed.models.icon * 0.539957) : null;
  }

  return {
    domain: 'marine',
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
    optimal_window: 'Early morning slack tide hours',
    model_intelligence: {
      consensus_score: multiModel ? multiModel.overallConsensusScore : 88,
      spread_level: multiModel ? multiModel.overallUncertainty : 'LOW',
      rain_probability_consensus: rainProb,
      wind_speed_consensus: windSpeedKmh,
      temperature_consensus: dailyWeather.high_c,
      model_values: modelValues,
      divergent_models: multiModel?.divergentModels || []
    }
  };
}
