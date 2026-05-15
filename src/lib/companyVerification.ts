export type CompanyVerificationStatus =
  | "draft"
  | "pending"
  | "verified"
  | "rejected"
  | "suspended"
  | "revoked";

export type CompanyDocumentType =
  | "registration"
  | "representative_id"
  | "power_of_attorney"
  | "license"
  | "product_certificate"
  | "other";

export const REQUIRED_DOCUMENT_TYPES: CompanyDocumentType[] = [
  "registration",
  "representative_id",
];

export const COMPANY_DOCUMENT_LABELS: Record<CompanyDocumentType, string> = {
  registration: "Выписка о регистрации (БИН/ТОО)",
  representative_id: "Удостоверение представителя",
  power_of_attorney: "Доверенность (если подаёт не директор)",
  license: "Лицензия / разрешение (по виду работ)",
  product_certificate: "Сертификаты на продукцию",
  other: "Прочий документ",
};

export const VERIFICATION_STATUS_LABELS: Record<CompanyVerificationStatus, string> = {
  draft: "Черновик",
  pending: "На проверке",
  verified: "Проверена",
  rejected: "Отклонена",
  suspended: "Скрыта модератором",
  revoked: "Снят статус «Проверено»",
};

export const VERIFICATION_STATUS_HINTS: Record<CompanyVerificationStatus, string> = {
  draft: "Загрузите документы и отправьте на проверку — после одобрения компания появится в каталоге.",
  pending: "Модератор проверяет документы. Обычно это занимает 1–2 рабочих дня.",
  verified: "Компания отображается в каталоге с бейджем «Проверено».",
  rejected: "Исправьте замечания, обновите документы и отправьте снова.",
  suspended:
    "Компания скрыта из каталога по решению модератора. Исправьте данные и отправьте документы на проверку снова.",
  revoked:
    "Бейдж «Проверено» снят. Компания остаётся в каталоге — загрузите документы и отправьте на проверку снова.",
};

export const COMPANY_DOCUMENTS_BUCKET = "company-documents";

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_DOCUMENT_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Браузер на Windows часто отдаёт пустой file.type — определяем по расширению */
export function resolveDocumentMime(file: File): string | null {
  if (file.type && ALLOWED_DOCUMENT_MIME.includes(file.type)) {
    return file.type;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  const mime = EXT_TO_MIME[ext];
  return mime && ALLOWED_DOCUMENT_MIME.includes(mime) ? mime : null;
}

export function canEditVerificationDocuments(status: CompanyVerificationStatus): boolean {
  return status === "draft" || status === "rejected" || status === "suspended" || status === "revoked";
}

export function hasRequiredDocuments(
  uploadedTypes: CompanyDocumentType[],
): boolean {
  return REQUIRED_DOCUMENT_TYPES.every((t) => uploadedTypes.includes(t));
}
