import { searchLocationTool } from './location';
import { getCurrentWeatherTool, getForecastTool } from './weather';
import { getWeatherRiskTool, getOfficialAlertsTool } from './alerts';
import { getAgricultureAdviceTool } from './agriculture';

export const tools = {
  search_location: searchLocationTool,
  get_current_weather: getCurrentWeatherTool,
  get_forecast: getForecastTool,
  get_weather_risk: getWeatherRiskTool,
  get_official_alerts: getOfficialAlertsTool,
  get_agriculture_advice: getAgricultureAdviceTool
};
