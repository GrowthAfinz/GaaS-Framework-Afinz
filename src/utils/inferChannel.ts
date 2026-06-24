/**
 * Inferência de canal a partir da taxonomia do activity_name.
 * Ex.: `afz_car_srs_aqs_push_car_...` → 'Push'.
 *
 * Os rótulos canônicos batem com a coluna `Canal` de `activities`:
 * 'E-mail' | 'SMS' | 'WhatsApp' | 'Push'.
 *
 * Atenção: o Canal salvo pode divergir da taxonomia em casos pontuais —
 * por isso a UI permite override manual da inferência.
 */

export type CommunicationChannel = 'E-mail' | 'SMS' | 'WhatsApp' | 'Push';

export const COMMUNICATION_CHANNELS: CommunicationChannel[] = ['E-mail', 'SMS', 'WhatsApp', 'Push'];

/** Quebra o activity_name em tokens minúsculos (separadores: tudo que não for [a-z0-9]). */
function tokenize(activityName: string): string[] {
  return activityName.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/** Infere o canal pela taxonomia. Retorna null se nenhum token de canal for reconhecido. */
export function inferChannelFromActivityName(activityName: string | null | undefined): CommunicationChannel | null {
  if (!activityName) return null;
  const tokens = tokenize(activityName);
  const has = (t: string) => tokens.includes(t);
  if (has('email') || has('mail')) return 'E-mail';
  if (has('sms')) return 'SMS';
  if (has('wpp') || has('whatsapp') || has('whats') || has('wa')) return 'WhatsApp';
  if (has('push')) return 'Push';
  return null;
}

/** Mapeia um canal cru (slot/activity) para o rótulo canônico, ou null se não reconhecer. */
export function toCanonicalChannel(raw: string | null | undefined): CommunicationChannel | null {
  if (!raw) return null;
  const c = raw.toLowerCase();
  if (/e-?mail/.test(c)) return 'E-mail';
  if (c.includes('sms')) return 'SMS';
  if (c.includes('whats') || c.includes('wpp')) return 'WhatsApp';
  if (c.includes('push')) return 'Push';
  return null;
}

/** True quando o canal é e-mail (entrada HTML + assunto + pré-cabeçalho). */
export function isEmailChannel(channel: string | null | undefined): boolean {
  return !!channel && /e-?mail/i.test(channel);
}

/** Slug seguro para path de storage: email | sms | whatsapp | push. */
export function channelSlug(channel: string): string {
  const c = channel.toLowerCase();
  if (/e-?mail/.test(c)) return 'email';
  if (c.includes('sms')) return 'sms';
  if (c.includes('whats') || c.includes('wpp')) return 'whatsapp';
  if (c.includes('push')) return 'push';
  return c.replace(/[^a-z0-9]+/g, '-') || 'outros';
}
