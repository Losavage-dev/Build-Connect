/** Служебное сообщение чата: ссылка на файл в bucket request-attachments */

export const CHAT_FILE_V1_MARKER = "__BC_FILE_V1__";

export type ParsedChatFile = { displayName: string; storagePath: string };

export function buildChatFileMessage(displayName: string, storagePath: string): string {
  const safeName = displayName.replace(/\r?\n/g, " ").trim() || "Вложение";
  const safePath = storagePath.replace(/\r?\n/g, "").trim();
  return `${CHAT_FILE_V1_MARKER}\n${safeName}\n${safePath}`;
}

export function tryParseChatFileMessage(content: string): ParsedChatFile | null {
  const normalized = content.startsWith(CHAT_FILE_V1_MARKER) ? content : content.trim();
  if (!normalized.startsWith(CHAT_FILE_V1_MARKER)) return null;
  const lines = normalized.split(/\n/);
  if (lines.length < 3) return null;
  const displayName = (lines[1] ?? "").trim() || "Вложение";
  const storagePath = (lines[2] ?? "").trim();
  if (!storagePath) return null;
  return { displayName, storagePath };
}
