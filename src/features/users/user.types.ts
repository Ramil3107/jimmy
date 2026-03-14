export interface User {
  id: string;
  telegram_id: number;
  display_name: string | null;
  language: string;
  timezone: string;
  onboarding_step: number;
  onboarding_complete: boolean;
  digest_morning_time: string | null;
  digest_evening_time: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  telegram_id: number;
  display_name?: string;
  language?: string;
  timezone?: string;
}

export interface UpdateUserData {
  display_name?: string;
  language?: string;
  timezone?: string;
  onboarding_step?: number;
  onboarding_complete?: boolean;
  digest_morning_time?: string;
  digest_evening_time?: string;
  last_active_at?: string;
}
