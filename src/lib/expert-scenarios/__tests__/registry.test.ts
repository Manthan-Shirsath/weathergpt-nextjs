import { describe, it, expect } from 'vitest';
import { SCENARIOS, getScenarioById, getScenariosByDomain } from '../registry';
import { ExpertScenario } from '../types';

describe('Scenario Registry', () => {
  it('should export a list of valid scenarios', () => {
    expect(SCENARIOS).toBeInstanceOf(Array);
    expect(SCENARIOS.length).toBeGreaterThan(0);
    
    // Check required fields
    for (const scenario of SCENARIOS) {
      expect(scenario.id).toBeDefined();
      expect(scenario.domain).toBeDefined();
      expect(scenario.title).toBeDefined();
      expect(scenario.question).toBeDefined();
    }
  });

  it('should find scenario by ID', () => {
    const scenario = getScenarioById('agriculture-stress-assessment');
    expect(scenario).toBeDefined();
    expect(scenario?.id).toBe('agriculture-stress-assessment');
  });

  it('should filter scenarios by domain', () => {
    const agScenarios = getScenariosByDomain('agriculture');
    expect(agScenarios.length).toBeGreaterThan(0);
    expect(agScenarios.every((s: ExpertScenario) => s.domain === 'agriculture')).toBe(true);
  });
});
