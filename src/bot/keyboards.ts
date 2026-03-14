import { InlineKeyboard } from 'grammy';

export function languageKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🇬🇧 English', 'lang:en')
    .text('🇺🇦 Українська', 'lang:uk')
    .row()
    .text('🇪🇸 Español', 'lang:es')
    .text('🇩🇪 Deutsch', 'lang:de')
    .row()
    .text('🇫🇷 Français', 'lang:fr')
    .text('🇵🇹 Português', 'lang:pt')
    .row()
    .text('🇹🇷 Türkçe', 'lang:tr')
    .text('🇦🇿 Azərbaycan', 'lang:az')
    .row()
    .text('🇮🇹 Italiano', 'lang:it')
    .text('🇵🇱 Polski', 'lang:pl')
    .row()
    .text('🇯🇵 日本語', 'lang:ja')
    .text('🇨🇳 中文', 'lang:zh')
    .row()
    .text('🇸🇦 العربية', 'lang:ar')
    .text('🇮🇳 हिन्दी', 'lang:hi')
    .row()
    .text('🌍 Other (type it)', 'lang:other');
}

export function timezoneRegionKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🇪🇺 Europe', 'tz_region:europe')
    .text('🌏 Asia', 'tz_region:asia')
    .row()
    .text('🇺🇸 Americas', 'tz_region:americas')
    .text('🌍 Africa', 'tz_region:africa')
    .row()
    .text('🌊 Pacific', 'tz_region:pacific')
    .text('🕐 UTC', 'tz:UTC')
    .row()
    .text('✏️ Type manually (e.g. "Europe/Kyiv")', 'tz_region:manual');
}

export function timezoneCitiesKeyboard(region: string): InlineKeyboard {
  const kb = new InlineKeyboard();
  const cities = timezoneCities[region] || [];

  for (let i = 0; i < cities.length; i += 2) {
    const row = cities.slice(i, i + 2);
    for (const city of row) {
      kb.text(city.label, `tz:${city.tz}`);
    }
    kb.row();
  }

  kb.text('✏️ Type manually', 'tz_region:manual');
  kb.text('⬅️ Back', 'tz_region:back');
  return kb;
}

const timezoneCities: Record<string, { label: string; tz: string }[]> = {
  europe: [
    { label: '🇬🇧 London', tz: 'Europe/London' },
    { label: '🇩🇪 Berlin', tz: 'Europe/Berlin' },
    { label: '🇫🇷 Paris', tz: 'Europe/Paris' },
    { label: '🇪🇸 Madrid', tz: 'Europe/Madrid' },
    { label: '🇮🇹 Rome', tz: 'Europe/Rome' },
    { label: '🇳🇱 Amsterdam', tz: 'Europe/Amsterdam' },
    { label: '🇺🇦 Kyiv', tz: 'Europe/Kyiv' },
    { label: '🇵🇱 Warsaw', tz: 'Europe/Warsaw' },
    { label: '🇷🇴 Bucharest', tz: 'Europe/Bucharest' },
    { label: '🇬🇷 Athens', tz: 'Europe/Athens' },
    { label: '🇫🇮 Helsinki', tz: 'Europe/Helsinki' },
    { label: '🇹🇷 Istanbul', tz: 'Europe/Istanbul' },
    { label: '🇷🇺 Moscow', tz: 'Europe/Moscow' },
    { label: '🇦🇿 Baku', tz: 'Asia/Baku' },
  ],
  asia: [
    { label: '🇦🇪 Dubai', tz: 'Asia/Dubai' },
    { label: '🇮🇳 Kolkata', tz: 'Asia/Kolkata' },
    { label: '🇹🇭 Bangkok', tz: 'Asia/Bangkok' },
    { label: '🇸🇬 Singapore', tz: 'Asia/Singapore' },
    { label: '🇨🇳 Shanghai', tz: 'Asia/Shanghai' },
    { label: '🇯🇵 Tokyo', tz: 'Asia/Tokyo' },
    { label: '🇰🇷 Seoul', tz: 'Asia/Seoul' },
    { label: '🇮🇱 Jerusalem', tz: 'Asia/Jerusalem' },
    { label: '🇬🇪 Tbilisi', tz: 'Asia/Tbilisi' },
    { label: '🇰🇿 Almaty', tz: 'Asia/Almaty' },
  ],
  americas: [
    { label: '🇺🇸 New York', tz: 'America/New_York' },
    { label: '🇺🇸 Chicago', tz: 'America/Chicago' },
    { label: '🇺🇸 Denver', tz: 'America/Denver' },
    { label: '🇺🇸 Los Angeles', tz: 'America/Los_Angeles' },
    { label: '🇨🇦 Toronto', tz: 'America/Toronto' },
    { label: '🇨🇦 Vancouver', tz: 'America/Vancouver' },
    { label: '🇧🇷 São Paulo', tz: 'America/Sao_Paulo' },
    { label: '🇲🇽 Mexico City', tz: 'America/Mexico_City' },
    { label: '🇦🇷 Buenos Aires', tz: 'America/Argentina/Buenos_Aires' },
    { label: '🇨🇴 Bogota', tz: 'America/Bogota' },
  ],
  africa: [
    { label: '🇿🇦 Johannesburg', tz: 'Africa/Johannesburg' },
    { label: '🇪🇬 Cairo', tz: 'Africa/Cairo' },
    { label: '🇳🇬 Lagos', tz: 'Africa/Lagos' },
    { label: '🇰🇪 Nairobi', tz: 'Africa/Nairobi' },
    { label: '🇲🇦 Casablanca', tz: 'Africa/Casablanca' },
    { label: '🇪🇹 Addis Ababa', tz: 'Africa/Addis_Ababa' },
  ],
  pacific: [
    { label: '🇦🇺 Sydney', tz: 'Australia/Sydney' },
    { label: '🇦🇺 Melbourne', tz: 'Australia/Melbourne' },
    { label: '🇦🇺 Perth', tz: 'Australia/Perth' },
    { label: '🇳🇿 Auckland', tz: 'Pacific/Auckland' },
    { label: '🇫🇯 Fiji', tz: 'Pacific/Fiji' },
  ],
};

/** Validate if a string is a valid IANA timezone */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function digestTimeKeyboard(type: 'morning' | 'evening'): InlineKeyboard {
  const kb = new InlineKeyboard();

  if (type === 'morning') {
    kb.text('06:00', 'digest:morning:06:00')
      .text('07:00', 'digest:morning:07:00')
      .text('08:00', 'digest:morning:08:00')
      .row()
      .text('09:00', 'digest:morning:09:00')
      .text('10:00', 'digest:morning:10:00')
      .text('⏭️ Skip', 'digest:morning:skip');
  } else {
    kb.text('19:00', 'digest:evening:19:00')
      .text('20:00', 'digest:evening:20:00')
      .text('21:00', 'digest:evening:21:00')
      .row()
      .text('22:00', 'digest:evening:22:00')
      .text('23:00', 'digest:evening:23:00')
      .text('⏭️ Skip', 'digest:evening:skip');
  }

  return kb;
}

export function confirmCancelKeyboard(actionId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Confirm', `confirm:${actionId}`)
    .text('❌ Cancel', `cancel:${actionId}`);
}
