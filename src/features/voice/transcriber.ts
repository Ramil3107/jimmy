import OpenAI from 'openai';
import { env } from '../../config/env.js';

let openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openai) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for voice transcription');
    }
    openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openai;
}

/**
 * Transcribe an audio buffer using OpenAI Whisper API.
 * grammY downloads Telegram voice messages as .ogg (opus) — Whisper accepts this directly.
 */
export async function transcribe(audioBuffer: Buffer, language?: string): Promise<string> {
  const client = getClient();

  const file = new File([new Uint8Array(audioBuffer)], 'voice.ogg', { type: 'audio/ogg' });

  const response = await client.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: language && language.length === 2 ? language : undefined,
  });

  return response.text.trim();
}
