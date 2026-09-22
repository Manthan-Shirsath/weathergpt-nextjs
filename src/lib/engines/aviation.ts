import { EngineInput, DecisionResult, DecisionFactor } from './types';

export function evaluateAviationDecision(input: EngineInput): DecisionResult {
  const { query, weather, multiModel } = input;
  const targetDayIdx = Math.min(query.targetDateOffsetDays, weather.daily.length - 1);
  const dailyWeather = weather.daily[targetDayIdx] || weather.daily[0];
  const location = weather.location.city || query.location || 'Airfield';

  const rainProb = multiModel ? multiModel.rainProbability.consensus : (dailyWeather.daily_precipitation_probability ?? 0);
  const windSpeedKmh = multiModel ? multiModel.windSpeed.consensus : (dailyWeather.wind_speed_max_kmh ?? 10);
  const windGustsKmh = dailyWeather.wind_gusts_max_kmh || Math.round(windSpeedKmh * 1.4);
  const maxTemp = multiModel ? multiModel.temperature.consensus : (dailyWeather.high_c ?? 28);
  const weatherCode = dailyWeather.weather_code ?? weather.current.weather_code ?? 0;
  const visibilityKm = weather.current.visibility_km ?? 10;
  const visibilitySm = Math.round((visibilityKm * 0.621371) * 10) / 10;

  // Derive Aeronautical Flight Category (FAA/ICAO Standards)
  let flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR' = 'VFR';
  let estimatedCeilingFt = 5000;

  const isThunderstorm = [95, 96, 99].includes(weatherCode);
  const isFogOrMist = [45, 48].includes(weatherCode);
  const isHeavyRain = [65, 67, 82].includes(weatherCode) || rainProb > 75;

  if (isFogOrMist || visibilitySm < 1.0) {
    flightCategory = 'LIFR';
    estimatedCeilingFt = 300;
  } else if (isHeavyRain || visibilitySm < 3.0) {
    flightCategory = 'IFR';
    estimatedCeilingFt = 800;
  } else if (visibilitySm <= 5.0 || rainProb > 45) {
    flightCategory = 'MVFR';
    estimatedCeilingFt = 2200;
  } else {
    flightCategory = 'VFR';
    estimatedCeilingFt = 6000;
  }

  const windKnots = Math.round(windSpeedKmh * 0.539957);
  const gustKnots = Math.round(windGustsKmh * 0.539957);

  const reasons: DecisionFactor[] = [];
  const actionableAdvice: string[] = [];
  let decision: DecisionResult['decision'] = 'FAVORABLE';
  let riskLevel: DecisionResult['risk_level'] = 'LOW';
  let summary = '';

  // 1. Convective Thunderstorm Alert
  if (isThunderstorm) {
    decision = 'NOT_RECOMMENDED';
    riskLevel = 'EXTREME';
    reasons.push({
      factor: 'Convective SIGMET Threat',
      value: `Thunderstorm activity (code ${weatherCode})`,
      threshold: 'Zero Convection',
      impact: 'critical'
    });
    actionableAdvice.push('Severe microburst, lightning, and extreme low-level wind shear hazard along approach path.');
    actionableAdvice.push('Circumnavigate convective cells by a minimum of 20 nautical miles.');
    summary = `CRITICAL AVIATION HAZARD: Severe convective storm activity detected at ${location}. Operations NOT RECOMMENDED.`;
  }
  // 2. Flight Category Constraints (VFR vs IFR)
  else if (flightCategory === 'IFR' || flightCategory === 'LIFR') {
    decision = 'NOT_RECOMMENDED';
    riskLevel = 'HIGH';
    reasons.push({
      factor: 'Flight Category',
      value: `${flightCategory} (Visibility ${visibilitySm} SM / ~${visibilityKm} km)`,
      threshold: 'VFR (> 5 SM / > 8 km)',
      impact: 'critical'
    });
    reasons.push({
      factor: 'Cloud Ceiling Estimate',
      value: `~${estimatedCeilingFt} ft AGL`,
      threshold: '> 3,000 ft for VFR',
      impact: 'critical'
    });
    actionableAdvice.push('Visual Flight Rules (VFR) flight is prohibited under current ceiling and visibility.');
    actionableAdvice.push('Instrument Rating (IFR) filed flight plan and precision approach minimums required.');
    summary = `${flightCategory} conditions prevailing at ${location}. VFR operations NOT RECOMMENDED.`;
  }
  // 3. High Surface Winds & Crosswind Drift
  else if (windKnots > 20 || gustKnots > 28) {
    decision = 'CAUTION';
    riskLevel = 'HIGH';
    reasons.push({
      factor: 'Surface Wind & Gusts',
      value: `${windKnots} kt (Gusts to ${gustKnots} kt / ${windGustsKmh} km/h)`,
      threshold: '< 15 kt crosswind limit',
      impact: 'critical'
    });
    actionableAdvice.push('Strong mechanical turbulence on final approach; compute maximum demonstrated crosswind component.');
    actionableAdvice.push('Expect increased landing roll and turbulent boundary layer below 1,000 ft AGL.');
    summary = `High surface winds and gust factor (${gustKnots} kt) create elevated crosswind risk at ${location}.`;
  }
  // 4. Marginal VFR or High Density Altitude
  else if (flightCategory === 'MVFR' || maxTemp > 35) {
    decision = 'CAUTION';
    riskLevel = 'MODERATE';
    if (flightCategory === 'MVFR') {
      reasons.push({
        factor: 'Flight Category',
        value: `MVFR (Ceiling ~${estimatedCeilingFt} ft, Vis ${visibilitySm} SM)`,
        threshold: 'VFR',
        impact: 'warning'
      });
      actionableAdvice.push('Marginal VFR: monitor weather trends closely for rapid deterioration into instrument conditions.');
    }
    if (maxTemp > 35) {
      reasons.push({
        factor: 'High Density Altitude',
        value: `Surface Temperature ${maxTemp}°C`,
        threshold: '< 32°C ISA margin',
        impact: 'warning'
      });
      actionableAdvice.push('High density altitude degrades engine thrust and climb gradient. Recalculate takeoff ground roll distance.');
    }
    summary = `Flight operations at ${location} feasible with CAUTION under Marginal VFR / Density Altitude advisory.`;
  }
  // 5. Optimal VFR
  else {
    decision = 'FAVORABLE';
    riskLevel = 'LOW';
    reasons.push({
      factor: 'Flight Category',
      value: `VFR (Ceiling > 5,000 ft, Vis ${visibilitySm} SM)`,
      threshold: 'Standard VFR',
      impact: 'positive'
    });
    reasons.push({
      factor: 'Surface Wind',
      value: `${windKnots} kt (${windSpeedKmh} km/h)`,
      threshold: '< 15 kt',
      impact: 'positive'
    });
    actionableAdvice.push('Standard visual flight rules apply. Excellent enroute and terminal visibility.');
    summary = `Optimal VFR conditions at ${location}. Surface winds light (${windKnots} kt) with unobstructed visibility.`;
  }

  const modelValues: Record<string, number | null | undefined> = {};
  if (multiModel) {
    modelValues['ECMWF Wind (km/h)'] = multiModel.windSpeed.models.ecmwf;
    modelValues['GFS Wind (km/h)'] = multiModel.windSpeed.models.gfs;
    modelValues['ICON Wind (km/h)'] = multiModel.windSpeed.models.icon;
  }

  return {
    domain: 'aviation',
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
    optimal_window: 'Morning or daylight VFR hours',
    model_intelligence: {
      consensus_score: multiModel ? multiModel.overallConsensusScore : 88,
      spread_level: multiModel ? multiModel.overallUncertainty : 'LOW',
      rain_probability_consensus: rainProb,
      wind_speed_consensus: windSpeedKmh,
      temperature_consensus: maxTemp,
      model_values: modelValues,
      divergent_models: multiModel?.divergentModels || []
    }
  };
}
