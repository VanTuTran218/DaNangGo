import { findBudgetRecommendations, validateRecommendationReferences } from './recommendations.repository';
import { recommendationRequestSchema } from './recommendations.validation';

export async function getRecommendations(body: unknown) {
  const input = recommendationRequestSchema.parse(body);
  await validateRecommendationReferences(input);
  const groups = await findBudgetRecommendations(input);
  return { budget: input.budget, groups };
}
