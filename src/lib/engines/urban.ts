import { EngineInput, DecisionResult, DecisionFactor } from './types';

export function evaluateUrbanDecision(input: EngineInput): DecisionResult {
  const { query, weather, multiModel } = input;
  const targetDayIdx = Math.min(query.targetDateOffsetDays, weather.daily.length - 1);
  const dailyWeather = weather.daily[targetDayIdx] || weather.daily[0];
  const location = weather.location.city || query.location || 'Metropolitan Area';

  const rainProb = multiModel ? multiModel.rainProbability.consensus : (dailyWeather.daily_precipitation_probability ?? 0);
  const rainAmountMm = multiModel ? multiModel.precipitationAmount.consensus : (dailyWeather.precipitation_sum_mm ?? 0);
  const windSpeedKmh = multiModel ? multiModel.windSpeed.consensus : (dailyWeather.wind_speed_max_kmh ?? 10);
  const maxTemp = multiModel ? multiModel.temperature.consensus : (dailyWeather.high_c ?? 28);
  const minTemp = dailyWeather.low_c ?? 22;

  // Detect Peak Rush-Hour Window (Morning 08:00-10:30 or Evening 17:30-20:30)
  const isRushHourTarget = query.timeRange 
    ? ((query.timeRange.startHour >= 7 && query.timeRange.startHour <= 10) || 
       (query.timeRange.startHour >= 16 && query.timeRange.startHour <= 20))
    : false;

  const reasons: DecisionFactor[] = [];
  const actionableAdvice: string[] = [];
  let decision: DecisionResult['decision'] = 'FAVORABLE';
  let riskLevel: DecisionResult['risk_level'] = 'LOW';
  let summary = '';
  let optimalWindow: string | undefined = undefined;

  // 1. Severe Urban Waterlogging & Road Submersion
  const isFlashWaterlogging = rainAmountMm >= 25.0 || (rainAmountMm >= 15.0 && rainProb >= 80);
  const isModerateUrbanRain = rainAmountMm >= 8.0 || rainProb >= 65;
  const isUrbanHeatIslandStress = maxTemp >= 38 || (maxTemp >= 35 && minTemp >= 27);

  if (isFlashWaterlogging) {
    decision = 'NOT_RECOMMENDED';
    riskLevel = 'HIGH';
    reasons.push({
      factor: 'Urban Drainage Surcharge',
      value: `${rainAmountMm} mm (${rainProb}% prob)`,
      threshold: 'Underpass Capacity: < 15 mm',
      impact: 'critical'
    });
    reasons.push({
      factor: 'Transit Disruption Index',
      value: 'Severe (Estimated +45 to +90 min delay)',
      threshold: 'Standard Commute',
      impact: 'critical'
    });
    actionableAdvice.push('Significant waterlogging anticipated in road underpasses, subway concourses, and arterial flyover ramps.');
    actionableAdvice.push('Transit alert: Suburban rail signals and bus corridors will face major holding delays; switch to telework if possible.');
    summary = `SEVERE COMMUTE DISRUPTION in ${location}: Heavy rainfall will overwhelm municipal stormwater drains, submerging low-lying junctions.`;
  } else if (isModerateUrbanRain) {
    decision = 'CAUTION';
    riskLevel = 'MODERATE';
    reasons.push({
      factor: 'Commute Weather Impact',
      value: `Rain probability ${rainProb}% (~${rainAmountMm} mm)`,
      threshold: '< 30% for clear flow',
      impact: 'warning'
    });
    actionableAdvice.push('Expect wet asphalt, reduced braking distance, and traffic congestion (+20 to +35 min delay).');
    actionableAdvice.push('Carry waterproof gear and allow additional buffer for public transit transfers.');
    optimalWindow = 'Midday off-peak travel (12:00 PM - 03:30 PM)';
    summary = `MODERATE COMMUTE DISRUPTION in ${location}: Intermittent rain will slow peak vehicular traffic. Plan for extended transit times.`;
  } else if (isUrbanHeatIslandStress) {
    decision = 'CAUTION';
    riskLevel = 'MODERATE';
    reasons.push({
      factor: 'Urban Heat Island (UHI) Index',
      value: `Day High: ${maxTemp}°C / Night Min: ${minTemp}°C`,
      threshold: '< 35°C / < 25°C',
      impact: 'warning'
    });
    actionableAdvice.push('High night temperature prevents concrete and asphalt cooling, amplifying building thermal loads.');
    actionableAdvice.push('Avoid strenuous outdoor exercise and construction activities between 11:30 AM and 04:30 PM.');
    optimalWindow = 'Early morning (06:00 - 08:30 AM)';
    summary = `URBAN HEAT STRESS ADVISORY for ${location}: Concrete thermal retention and high ambient temperatures create elevated pedestrian stress.`;
  } else {
    decision = 'FAVORABLE';
    riskLevel = 'LOW';
    reasons.push({
      factor: 'Urban Transit Conditions',
      value: `Clear weather, Wind: ${windSpeedKmh} km/h`,
      threshold: 'Optimal Transit',
      impact: 'positive'
    });
    actionableAdvice.push('Roadways and public transportation networks operating with standard weather safety.');
    actionableAdvice.push('Favorable conditions for outdoor events, walking, and city activities.');
    summary = `FAVORABLE COMMUTE & URBAN CONDITIONS for ${location}: Dry roads and moderate temperatures supporting normal metropolitan mobility.`;
  }

  const modelValues: Record<string, number | null | undefined> = {};
  if (multiModel) {
    modelValues['ECMWF Rain Prob'] = multiModel.rainProbability.models.ecmwf;
    modelValues['GFS Rain Prob'] = multiModel.rainProbability.models.gfs;
    modelValues['ICON Rain Prob'] = multiModel.rainProbability.models.icon;
  }

  return {
    domain: 'urban',
    intent: query.intent,
    targetDate: multiModel?.targetDateStr || dailyWeather.date,
    timeWindowLabel: multiModel?.timeWindowLabel || (query.timeRange?.label || (isRushHourTarget ? 'rush hour' : 'full day')),
    location,
    decision,
    risk_level: riskLevel,
    confidence: multiModel?.overallUncertainty === 'HIGH' ? 'LOW' : 'HIGH',
    summary,
    reasons,
    actionable_advice: actionableAdvice,
    optimal_window: optimalWindow,
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
