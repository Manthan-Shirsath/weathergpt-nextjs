import { describe, it, expect } from 'vitest';
import { tools } from '../tools';

describe('AI Tools Registry', () => {
  it('exports the required tools', () => {
    expect(tools.search_location).toBeDefined();
    expect(tools.get_current_weather).toBeDefined();
    expect(tools.get_forecast).toBeDefined();
    expect(tools.get_weather_risk).toBeDefined();
    expect(tools.get_agriculture_advice).toBeDefined();
  });
});
