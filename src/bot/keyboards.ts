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

/** UTC offset keyboard — grouped in rows of 3 */
export function utcOffsetKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('UTC-8', 'tz:Etc/GMT+8')
    .text('UTC-7', 'tz:Etc/GMT+7')
    .text('UTC-6', 'tz:Etc/GMT+6')
    .row()
    .text('UTC-5', 'tz:Etc/GMT+5')
    .text('UTC-4', 'tz:Etc/GMT+4')
    .text('UTC-3', 'tz:Etc/GMT+3')
    .row()
    .text('UTC-1', 'tz:Etc/GMT+1')
    .text('UTC+0', 'tz:Etc/GMT')
    .text('UTC+1', 'tz:Etc/GMT-1')
    .row()
    .text('UTC+2', 'tz:Etc/GMT-2')
    .text('UTC+3', 'tz:Etc/GMT-3')
    .text('UTC+4', 'tz:Etc/GMT-4')
    .row()
    .text('UTC+5', 'tz:Etc/GMT-5')
    .text('UTC+5:30', 'tz:Asia/Kolkata')
    .text('UTC+6', 'tz:Etc/GMT-6')
    .row()
    .text('UTC+7', 'tz:Etc/GMT-7')
    .text('UTC+8', 'tz:Etc/GMT-8')
    .text('UTC+9', 'tz:Etc/GMT-9')
    .row()
    .text('UTC+10', 'tz:Etc/GMT-10')
    .text('UTC+12', 'tz:Etc/GMT-12')
    .row()
    .text('✏️ Type city (e.g. "Europe/Lisbon")', 'tz_region:manual');
}

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
