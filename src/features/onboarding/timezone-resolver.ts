import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { isValidTimezone } from '../../bot/keyboards.js';
import { logger } from '../../core/logger.js';

let openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openai) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }
    openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openai;
}

export interface TimezoneResult {
  timezone: string | null;
  display: string | null;
}

/**
 * Ask the LLM to resolve a user's natural language input into an IANA timezone.
 * Returns null timezone if the input is gibberish or unresolvable.
 */
export async function resolveTimezone(input: string): Promise<TimezoneResult> {
  // If they typed a valid IANA timezone directly, just accept it
  if (isValidTimezone(input.trim())) {
    return { timezone: input.trim(), display: input.trim() };
  }

  const client = getClient();

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You resolve user input into IANA timezones. The user is telling you where they live or what their timezone is.

Rules:
- Return ONLY a JSON object: {"timezone": "Area/City", "display": "City, Country"}
- timezone must be a valid IANA timezone (e.g. "Europe/Lisbon", "America/New_York")
- display is a human-friendly name (e.g. "Lisbon, Portugal", "New York, USA")
- If the input is gibberish, nonsense, or you cannot determine a timezone, return {"timezone": null, "display": null}
- Do NOT guess. If unclear, return null.
- Common examples: "lisbon" → Europe/Lisbon, "new york" → America/New_York, "tokyo" → Asia/Tokyo, "baku" → Asia/Baku, "kyiv" → Europe/Kyiv, "portugal" → Europe/Lisbon, "germany" → Europe/Berlin`,
      },
      { role: 'user', content: input },
    ],
    temperature: 0,
    max_tokens: 100,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) return { timezone: null, display: null };

  try {
    const parsed = JSON.parse(raw) as TimezoneResult;

    // Validate the returned timezone is actually valid
    if (parsed.timezone && isValidTimezone(parsed.timezone)) {
      return parsed;
    }

    return { timezone: null, display: null };
  } catch {
    logger.error({ raw }, 'Failed to parse timezone LLM response');
    return { timezone: null, display: null };
  }
}

/** Mock version for MOCK_LLM mode */
export function mockResolveTimezone(input: string): TimezoneResult {
  const lower = input.toLowerCase().trim();
  const map: Record<string, TimezoneResult> = {
    lisbon: { timezone: 'Europe/Lisbon', display: 'Lisbon, Portugal' },
    london: { timezone: 'Europe/London', display: 'London, UK' },
    'new york': { timezone: 'America/New_York', display: 'New York, USA' },
    tokyo: { timezone: 'Asia/Tokyo', display: 'Tokyo, Japan' },
    baku: { timezone: 'Asia/Baku', display: 'Baku, Azerbaijan' },
    kyiv: { timezone: 'Europe/Kyiv', display: 'Kyiv, Ukraine' },
    berlin: { timezone: 'Europe/Berlin', display: 'Berlin, Germany' },
    paris: { timezone: 'Europe/Paris', display: 'Paris, France' },
    portugal: { timezone: 'Europe/Lisbon', display: 'Lisbon, Portugal' },
    germany: { timezone: 'Europe/Berlin', display: 'Berlin, Germany' },
  };

  return map[lower] || { timezone: null, display: null };
}
