/** Маркер между текстом заявки и служебным блоком (источник, ссылки) — не показывать пользователю как обычный текст. */
export const CHAT_REQUEST_CONTEXT_MARKER = "\n\n⟦buildconnect:context⟧\n";

export const META_LINE_COMPANY = "Компания-исполнитель:";
export const META_LINE_SOURCE = "Источник:";
export const META_LINE_LINK = "Ссылка:";
export const META_LINE_PROMO = "Ролик на витрине:";

/** Если в тексте оказался «ломаный» маркер без переносов строк */
const LEGACY_ALT_MARKER = "\n\n[[buildconnect:context]]\n";

function splitByAnyMarker(content: string): { body: string; meta: string | null } {
  for (const m of [CHAT_REQUEST_CONTEXT_MARKER, LEGACY_ALT_MARKER]) {
    if (content.includes(m)) {
      const [body, ...rest] = content.split(m);
      return { body: body.trimEnd(), meta: rest.join(m).trim() || null };
    }
  }
  return { body: content, meta: null };
}

export function splitRequestOpeningMessage(content: string): { body: string; meta: string | null } {
  return splitByAnyMarker(content);
}

/** Старый формат отклика: «От компании «…». текст» в одной строке с сообщением */
const LEGACY_COMPANY_PREFIX_RE = /^От компании «([^»]+)»\.\s*/;

export function parseOpeningMessageBody(body: string): { userText: string; companyName: string | null } {
  const trimmed = body.trim();
  const legacy = trimmed.match(LEGACY_COMPANY_PREFIX_RE);
  if (legacy) {
    return {
      companyName: legacy[1],
      userText: trimmed.slice(legacy[0].length).trim(),
    };
  }
  return { userText: trimmed, companyName: null };
}

/** Имя компании из блока контекста (новый формат) */
export function companyNameFromMeta(meta: string | null): string | null {
  if (!meta) return null;
  for (const line of meta.split("\n")) {
    const m = line.trim().match(new RegExp(`^${META_LINE_COMPANY}\\s*«([^»]+)»`));
    if (m) return m[1];
  }
  return null;
}

/** Текст для превью в списке заявок (без маркера и блока контекста) */
export function formatChatListPreview(raw: string, maxLen = 220): string {
  const { body, meta } = splitRequestOpeningMessage(raw);
  const { userText } = parseOpeningMessageBody(body);
  let base = userText.replace(/\[\[buildconnect:context\]\]/g, "").replace(/⟦buildconnect:context⟧/g, "").trim();
  let out = base;
  if (meta && !base) {
    out = "Сообщение с контекстом заявки";
  }
  if (out.length <= maxLen) return out;
  return `${out.slice(0, maxLen - 1)}…`;
}
