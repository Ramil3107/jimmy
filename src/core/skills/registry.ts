import type { Skill } from './types.js';
import type { SkillDescription } from '../llm/types.js';
import { logger } from '../logger.js';

const skills = new Map<string, Skill>();
const intentToSkill = new Map<string, Skill>();

export function registerSkill(skill: Skill): void {
  if (skills.has(skill.name)) {
    logger.warn({ skill: skill.name }, 'Skill already registered, overwriting');
  }

  skills.set(skill.name, skill);

  for (const intent of skill.intents) {
    intentToSkill.set(intent, skill);
  }

  logger.info({ skill: skill.name, intents: skill.intents }, 'Skill registered');
}

export function getSkillByIntent(intent: string): Skill | undefined {
  return intentToSkill.get(intent);
}

export function getSkillDescriptions(): SkillDescription[] {
  return Array.from(skills.values()).map((s) => ({
    name: s.name,
    intents: s.intents,
    description: s.description,
    examples: s.examples,
  }));
}

export function getAllSkills(): Skill[] {
  return Array.from(skills.values());
}

/** Clear all skills — used in tests */
export function clearSkills(): void {
  skills.clear();
  intentToSkill.clear();
}
