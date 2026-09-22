import { EngineInput, DecisionResult, DecisionFactor } from './types';

export function evaluateAgricultureDecision(input: EngineInput): DecisionResult {
  const { query, weather, multiModel } = input;
  const targetDayIdx = Math.min(query.targetDateOffsetDays, weather.daily.length - 1);
  const dailyWeather = weather.daily[targetDayIdx] || weather.daily[0];
  const location = weather.location.city || query.location || 'Your Region';
  const crop = query.crop || 'General Field Crop';

  // Multi-model metrics with fallback to standard daily weather
  const rainProb = multiModel ? multiModel.rainProbability.consensus : (dailyWeather.daily_precipitation_probability ?? dailyWeather.rain_probability_pct ?? 0);
  const rainAmount = multiModel ? multiModel.precipitationAmount.consensus : (dailyWeather.precipitation_sum_mm ?? 0);
  const windSpeed = multiModel ? multiModel.windSpeed.consensus : (dailyWeather.wind_speed_max_kmh ?? 10);
  const maxTemp = multiModel ? multiModel.temperature.consensus : (dailyWeather.high_c ?? 28);
  const consensusScore = multiModel ? multiModel.overallConsensusScore : 85;
  const spreadLevel = multiModel ? multiModel.overallUncertainty : 'LOW';

  const reasons: DecisionFactor[] = [];
  const actionableAdvice: string[] = [];
  let decision: DecisionResult['decision'] = 'RECOMMENDED';
  let riskLevel: DecisionResult['risk_level'] = 'LOW';
  let summary = '';
  let optimalWindow: string | undefined = undefined;

  // -------------------------------------------------------------
  // 1. SPRAYING DECISION
  // -------------------------------------------------------------
  if (query.intent === 'spraying') {
    const isWashOffRisk = rainProb >= 40 || rainAmount >= 1.0;
    const isHighWindDrift = windSpeed > 15;
    const isCalmInversion = windSpeed < 3 && maxTemp > 28;
    const isHeatEvaporation = maxTemp > 32;

    if (isWashOffRisk) {
      decision = 'NOT_RECOMMENDED';
      riskLevel = 'HIGH';
      reasons.push({
        factor: 'Precipitation Probability',
        value: `${rainProb}%`,
        threshold: '< 35%',
        impact: 'critical'
      });
      reasons.push({
        factor: 'Expected Rainfall',
        value: `${rainAmount} mm`,
        threshold: '< 1.0 mm',
        impact: 'critical'
      });
      actionableAdvice.push('Postpone pesticide spraying to avoid chemical wash-off and environmental leaching.');
      actionableAdvice.push('Target the next 48-hour dry spell window when multi-model rain probability drops under 20%.');
      summary = `Spraying ${crop} in ${location} is NOT RECOMMENDED due to high precipitation wash-off risk (${rainProb}% chance of rain).`;
    } else if (isHighWindDrift) {
      decision = 'NOT_RECOMMENDED';
      riskLevel = 'HIGH';
      reasons.push({
        factor: 'Wind Speed',
        value: `${windSpeed} km/h`,
        threshold: '< 15 km/h',
        impact: 'critical'
      });
      actionableAdvice.push('High wind speeds create severe droplet drift risk onto non-target crops and nearby water bodies.');
      actionableAdvice.push('Wait for wind to subside below 12 km/h, typically early in the morning between 06:00 and 08:30 AM.');
      summary = `Spraying ${crop} in ${location} is NOT RECOMMENDED due to excessive wind speed (${windSpeed} km/h), causing spray drift.`;
    } else if (isCalmInversion || isHeatEvaporation) {
      decision = 'CAUTION';
      riskLevel = 'MODERATE';
      if (isHeatEvaporation) {
        reasons.push({
          factor: 'Temperature',
          value: `${maxTemp}°C`,
          threshold: '< 30°C',
          impact: 'warning'
        });
        actionableAdvice.push('High temperatures cause rapid droplet evaporation before systemic absorption.');
      }
      if (isCalmInversion) {
        reasons.push({
          factor: 'Calm Wind (Inversion)',
          value: `${windSpeed} km/h`,
          threshold: '> 3 km/h',
          impact: 'warning'
        });
        actionableAdvice.push('Near-zero wind can trap droplet fog in thermal inversion layers.');
      }
      optimalWindow = 'Early morning (06:00 - 09:00 AM) or late afternoon (04:30 - 06:30 PM)';
      actionableAdvice.push(`Spray during the cooler window: ${optimalWindow}.`);
      summary = `Spraying ${crop} in ${location} is SUITABLE WITH CAUTION. Avoid midday heat and thermal inversion.`;
    } else {
      decision = 'RECOMMENDED';
      riskLevel = 'LOW';
      reasons.push({
        factor: 'Precipitation Probability',
        value: `${rainProb}%`,
        threshold: '< 35%',
        impact: 'positive'
      });
      reasons.push({
        factor: 'Wind Speed',
        value: `${windSpeed} km/h`,
        threshold: '3 - 15 km/h',
        impact: 'positive'
      });
      reasons.push({
        factor: 'Temperature',
        value: `${maxTemp}°C`,
        threshold: '18 - 30°C',
        impact: 'positive'
      });
      optimalWindow = 'Morning 07:00 - 10:30 AM';
      actionableAdvice.push('Conditions are favorable for spraying with minimal drift and excellent adhesion.');
      actionableAdvice.push('Use appropriate protective personal equipment (PPE) and calibrate nozzle pressure.');
      summary = `Spraying ${crop} in ${location} is HIGHLY RECOMMENDED. Weather parameters are within optimal agronomic thresholds.`;
    }
  }

  // -------------------------------------------------------------
  // 2. IRRIGATION DECISION
  // -------------------------------------------------------------
  else if (query.intent === 'irrigation') {
    const hasIncomingRain = rainProb >= 50 || rainAmount >= 4.0;
    const isSevereHeat = maxTemp >= 34;

    if (hasIncomingRain) {
      decision = 'NOT_RECOMMENDED';
      riskLevel = 'MODERATE';
      reasons.push({
        factor: 'Incoming Rain',
        value: `${rainAmount} mm (${rainProb}% prob)`,
        threshold: '< 3.0 mm',
        impact: 'critical'
      });
      actionableAdvice.push('Save water and pumping energy: natural precipitation will satisfy soil moisture requirements.');
      actionableAdvice.push('Ensure field drainage channels are clear to prevent water stagnation around root zones.');
      summary = `Irrigation for ${crop} in ${location} is NOT RECOMMENDED. Substantial rainfall (${rainAmount} mm) is expected.`;
    } else if (isSevereHeat) {
      decision = 'RECOMMENDED';
      riskLevel = 'MODERATE';
      reasons.push({
        factor: 'High Temperature (Heat Stress)',
        value: `${maxTemp}°C`,
        threshold: '< 32°C',
        impact: 'warning'
      });
      reasons.push({
        factor: 'Rainfall',
        value: `${rainAmount} mm`,
        threshold: 'Dry',
        impact: 'positive'
      });
      optimalWindow = 'Night or Early Morning (05:00 - 08:00 AM)';
      actionableAdvice.push('Irrigate deeply during early morning or night to minimize evaporation and prevent leaf scalding.');
      actionableAdvice.push('If using drip irrigation, maintain standard fertigation cycles.');
      summary = `Irrigation for ${crop} in ${location} is RECOMMENDED. High temperatures (${maxTemp}°C) and low rainfall create significant evapotranspiration.`;
    } else {
      decision = 'CAUTION';
      riskLevel = 'LOW';
      reasons.push({
        factor: 'Rainfall & Moisture',
        value: `${rainAmount} mm`,
        threshold: 'Normal',
        impact: 'positive'
      });
      actionableAdvice.push('Check topsoil moisture at 5-10 cm depth before applying full water duty.');
      summary = `Irrigation for ${crop} in ${location} is OPTIONAL. Weather is moderate; irrigate based on local soil moisture.`;
    }
  }

  // -------------------------------------------------------------
  // 3. HARVESTING DECISION
  // -------------------------------------------------------------
  else if (query.intent === 'harvesting') {
    if (rainProb > 40 || rainAmount > 2.0) {
      decision = 'NOT_RECOMMENDED';
      riskLevel = 'HIGH';
      reasons.push({
        factor: 'Rain Probability during Harvest',
        value: `${rainProb}%`,
        threshold: '< 20%',
        impact: 'critical'
      });
      actionableAdvice.push('Delay harvest: rain during cutting causes grain moisture absorption, mold, and machine bogging.');
      actionableAdvice.push('Cover already harvested produce with tarpaulins.');
      summary = `Harvesting ${crop} in ${location} is NOT RECOMMENDED due to expected showers.`;
    } else {
      decision = 'RECOMMENDED';
      riskLevel = 'LOW';
      reasons.push({
        factor: 'Dry Weather Stability',
        value: `Rain prob ${rainProb}%`,
        threshold: '< 25%',
        impact: 'positive'
      });
      actionableAdvice.push('Conditions are dry and suitable for harvesting machinery and sun drying.');
      summary = `Harvesting ${crop} in ${location} is RECOMMENDED under favorable dry conditions.`;
    }
  }

  // -------------------------------------------------------------
  // 4. HEAT STRESS / CROP HEALTH / GENERAL SUMMARY
  // -------------------------------------------------------------
  else {
    if (maxTemp > 35) {
      decision = 'CAUTION';
      riskLevel = 'HIGH';
      reasons.push({
        factor: 'Heat Stress Alert',
        value: `${maxTemp}°C`,
        threshold: '< 34°C',
        impact: 'critical'
      });
      actionableAdvice.push('Provide light irrigation to cool root zones.');
      summary = `High heat warning (${maxTemp}°C) for ${crop} in ${location}.`;
    } else {
      decision = 'FAVORABLE';
      riskLevel = 'LOW';
      reasons.push({
        factor: 'Overall Weather Profile',
        value: `${maxTemp}°C, Wind ${windSpeed} km/h, Rain ${rainProb}%`,
        threshold: 'Normal',
        impact: 'positive'
      });
      actionableAdvice.push('Standard farming operations can proceed smoothly.');
      summary = `General agricultural weather conditions for ${crop} in ${location} are favorable.`;
    }
  }

  const modelValues: Record<string, number | null | undefined> = {};
  if (multiModel) {
    modelValues['ECMWF Rain Prob'] = multiModel.rainProbability.models.ecmwf;
    modelValues['GFS Rain Prob'] = multiModel.rainProbability.models.gfs;
    modelValues['ICON Rain Prob'] = multiModel.rainProbability.models.icon;
  }

  return {
    domain: 'agriculture',
    intent: query.intent,
    targetDate: multiModel?.targetDateStr || dailyWeather.date,
    timeWindowLabel: multiModel?.timeWindowLabel || (query.timeRange?.label || 'full day'),
    location,
    targetCrop: crop,
    decision,
    risk_level: riskLevel,
    confidence: spreadLevel === 'HIGH' ? 'LOW' : (spreadLevel === 'MODERATE' ? 'MEDIUM' : 'HIGH'),
    summary,
    reasons,
    actionable_advice: actionableAdvice,
    optimal_window: optimalWindow,
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
