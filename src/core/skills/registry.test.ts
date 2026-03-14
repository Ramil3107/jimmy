import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn() },
}));

import {
  registerSkill,
  getSkillByIntent,
  getSkillDescriptions,
  getAllSkills,
  clearSkills,
} from './registry.js';
import type { Skill } from './types.js';

const fakeSkill: Skill = {
  name: 'test-skill',
  intents: ['test_intent', 'test_intent_2'],
  description: 'A test skill',
  examples: ['do test'],
  handler: vi.fn(),
};

const fakeSkill2: Skill = {
  name: 'another-skill',
  intents: ['another_intent'],
  description: 'Another skill',
  examples: ['do another'],
  handler: vi.fn(),
};

beforeEach(() => {
  clearSkills();
});

describe('registerSkill', () => {
  it('registers a skill', () => {
    registerSkill(fakeSkill);
    expect(getAllSkills()).toHaveLength(1);
    expect(getAllSkills()[0].name).toBe('test-skill');
  });

  it('maps all intents to the skill', () => {
    registerSkill(fakeSkill);
    expect(getSkillByIntent('test_intent')).toBe(fakeSkill);
    expect(getSkillByIntent('test_intent_2')).toBe(fakeSkill);
  });
});

describe('getSkillByIntent', () => {
  it('returns undefined for unknown intent', () => {
    expect(getSkillByIntent('nonexistent')).toBeUndefined();
  });

  it('returns correct skill', () => {
    registerSkill(fakeSkill);
    registerSkill(fakeSkill2);
    expect(getSkillByIntent('another_intent')).toBe(fakeSkill2);
  });
});

describe('getSkillDescriptions', () => {
  it('returns descriptions for LLM prompt', () => {
    registerSkill(fakeSkill);
    registerSkill(fakeSkill2);

    const descriptions = getSkillDescriptions();
    expect(descriptions).toHaveLength(2);
    expect(descriptions[0]).toEqual({
      name: 'test-skill',
      intents: ['test_intent', 'test_intent_2'],
      description: 'A test skill',
      examples: ['do test'],
    });
  });
});

describe('clearSkills', () => {
  it('removes all skills', () => {
    registerSkill(fakeSkill);
    expect(getAllSkills()).toHaveLength(1);

    clearSkills();
    expect(getAllSkills()).toHaveLength(0);
    expect(getSkillByIntent('test_intent')).toBeUndefined();
  });
});
