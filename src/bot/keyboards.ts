import { InlineKeyboard } from 'grammy';

export function languageKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🇬🇧 English', 'lang:en')
    .text('🇷🇺 Русский', 'lang:ru')
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
    .text('🕐 UTC', 'tz:UTC');
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
    { label: '🇹🇷 Istanbul', tz: 'Europe/Istanbul' },
    { label: '🇷🇺 Moscow', tz: 'Europe/Moscow' },
    { label: '🇦🇿 Baku', tz: 'Asia/Baku' },
  ],
  asia: [
    { label: '🇦🇪 Dubai', tz: 'Asia/Dubai' },
    { label: '🇮🇳 Kolkata', tz: 'Asia/Kolkata' },
    { label: '🇹🇭 Bangkok', tz: 'Asia/Bangkok' },
    { label: '🇨🇳 Shanghai', tz: 'Asia/Shanghai' },
    { label: '🇯🇵 Tokyo', tz: 'Asia/Tokyo' },
    { label: '🇰🇷 Seoul', tz: 'Asia/Seoul' },
  ],
  americas: [
    { label: '🇺🇸 New York', tz: 'America/New_York' },
    { label: '🇺🇸 Chicago', tz: 'America/Chicago' },
    { label: '🇺🇸 Denver', tz: 'America/Denver' },
    { label: '🇺🇸 Los Angeles', tz: 'America/Los_Angeles' },
    { label: '🇧🇷 São Paulo', tz: 'America/Sao_Paulo' },
    { label: '🇲🇽 Mexico City', tz: 'America/Mexico_City' },
  ],
  africa: [
    { label: '🇿🇦 Johannesburg', tz: 'Africa/Johannesburg' },
    { label: '🇪🇬 Cairo', tz: 'Africa/Cairo' },
    { label: '🇳🇬 Lagos', tz: 'Africa/Lagos' },
    { label: '🇰🇪 Nairobi', tz: 'Africa/Nairobi' },
  ],
  pacific: [
    { label: '🇦🇺 Sydney', tz: 'Australia/Sydney' },
    { label: '🇦🇺 Melbourne', tz: 'Australia/Melbourne' },
    { label: '🇳🇿 Auckland', tz: 'Pacific/Auckland' },
  ],
};

export function digestTimeKeyboard(type: 'morning' | 'evening'): InlineKeyboard {
  const kb = new InlineKeyboard();

  if (type === 'morning') {
    kb.text('07:00', 'digest:morning:07:00')
      .text('08:00 ✓', 'digest:morning:08:00')
      .text('09:00', 'digest:morning:09:00')
      .row()
      .text('10:00', 'digest:morning:10:00')
      .text('⏭️ Skip', 'digest:morning:skip');
  } else {
    kb.text('20:00', 'digest:evening:20:00')
      .text('21:00 ✓', 'digest:evening:21:00')
      .text('22:00', 'digest:evening:22:00')
      .row()
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
