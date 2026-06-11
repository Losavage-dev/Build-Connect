import type { TFunction } from "i18next";

/** Маппинг сообщений Zod (ru) → ключи validation namespace. */
const MESSAGE_KEYS: Record<string, string> = {
  "Минимум 2 символа": "minLength2",
  "Максимум 40 символов": "maxLength40",
  "Только буквы, пробел, дефис или апостроф": "namePattern",
  "Укажите email": "emailRequired",
  "Некорректный email": "emailInvalid",
  "Пароль не короче 6 символов": "passwordMin",
  "Пароль слишком длинный": "passwordMax",
  "Введите пароль": "passwordRequired",
  "Выберите тип аккаунта": "roleRequired",
  "Укажите телефон": "phoneRequired",
  "Укажите номер Казахстана: 10 цифр (7XX…) или +7 …": "phoneKz",
  "Выберите город": "cityRequired",
  "Укажите название компании": "companyNameRequired",
  "До 100 символов": "companyNameMax",
  "Выберите хотя бы одну категорию": "categoryRequired",
  "Описание до 2000 символов": "descriptionMax",
  "Телефон до 20 символов": "phoneMax",
  "Некорректный email компании": "companyEmailInvalid",
  "БИН должен содержать 12 цифр": "binInvalid",
  "Выберите причину": "reportReasonRequired",
  "Комментарий до 2000 символов": "reportDetailsMax",
  "Проверьте введённые данные": "generic",
};

export function translateValidationError(message: string, t: TFunction<"validation">): string {
  const key = MESSAGE_KEYS[message];
  return key ? t(key) : message;
}
