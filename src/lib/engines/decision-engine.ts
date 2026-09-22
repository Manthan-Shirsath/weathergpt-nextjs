import { EngineInput, DecisionResult } from './types';
import { evaluateAgricultureDecision } from './agriculture';
import { evaluateAviationDecision } from './aviation';
import { evaluateDisasterDecision } from './disaster';
import { evaluateMarineDecision } from './marine';
import { evaluateUrbanDecision } from './urban';
import { evaluateGeneralDecision } from './general';

export function runDecisionEngine(input: EngineInput): DecisionResult {
  const { query } = input;

  switch (query.domain) {
    case 'agriculture':
      return evaluateAgricultureDecision(input);
    case 'aviation':
      return evaluateAviationDecision(input);
    case 'disaster':
      return evaluateDisasterDecision(input);
    case 'marine':
      return evaluateMarineDecision(input);
    case 'urban':
      return evaluateUrbanDecision(input);
    case 'general':
    default:
      return evaluateGeneralDecision(input);
  }
}
