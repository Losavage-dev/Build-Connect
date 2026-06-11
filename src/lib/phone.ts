/** Казахстан: 10 цифр национального номера (7XX…), без префикса страны. */

const KZ_MOBILE_PATTERN = /^7\d{9}$/;

/** Из произвольного ввода → 10 цифр (7001234567) или null. */
export function parseKzPhoneDigits(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    const national = digits.slice(1);
    return KZ_MOBILE_PATTERN.test(national) ? national : null;
  }
  if (digits.length === 10 && KZ_MOBILE_PATTERN.test(digits)) {
    return digits;
  }
  return null;
}

/** E.164 для хранения: +77001234567 */
export function normalizeKzPhone(input: string): string | null {
  const national = parseKzPhoneDigits(input);
  return national ? `+7${national}` : null;
}

/** Отображение: +7 700 123 45 67 */
export function formatKzPhoneDisplay(input: string): string {
  const normalized = normalizeKzPhone(input);
  if (!normalized) return input.trim();
  const national = normalized.slice(2);
  return `+7 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6, 8)} ${national.slice(8)}`;
}

export function isValidKzPhone(input: string): boolean {
  return normalizeKzPhone(input) !== null;
}
