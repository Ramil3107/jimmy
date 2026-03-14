import { env } from '../../config/env.js';
import { routeMessage as realRoute } from './router.js';
import { mockRouteMessage } from './mock-router.js';
import { logger } from '../logger.js';
import type { IntentResult, RoutingContext } from './types.js';

export type { IntentResult, RoutingContext, SkillDescription } from './types.js';

export async function routeMessage(
  text: string,
  context: RoutingContext,
): Promise<IntentResult> {
  if (env.MOCK_LLM) {
    logger.debug('Using mock LLM router');
    return mockRouteMessage(text, context);
  }

  return realRoute(text, context);
}
