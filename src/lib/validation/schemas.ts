import { z } from "zod";
import { normalizeKzPhone } from "@/lib/phone";

/** Имя/фамилия: буквы (латиница, кириллица, казахские), пробел, дефис, апостроф */
export const PERSON_NAME_PATTERN = /^[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҮүІі\s'-]+$/u;

export const personNameSchema = z
  .string()
  .trim()
  .min(2, "Минимум 2 символа")
  .max(40, "Максимум 40 символов")
  .regex(PERSON_NAME_PATTERN, "Только буквы, пробел, дефис или апостроф");

const emailSchema = z
  .string()
  .trim()
  .min(1, "Укажите email")
  .email("Некорректный email");

const passwordSchema = z
  .string()
  .min(6, "Пароль не короче 6 символов")
  .max(72, "Пароль слишком длинный");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Введите пароль"),
});

export const registerSchema = z.object({
  firstName: personNameSchema,
  lastName: personNameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["client", "contractor", "supplier"], {
    errorMap: () => ({ message: "Выберите тип аккаунта" }),
  }),
});

export const kzPhoneSchema = z
  .string()
  .trim()
  .min(1, "Укажите телефон")
  .superRefine((value, ctx) => {
    if (!normalizeKzPhone(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Укажите номер Казахстана: 10 цифр (7XX…) или +7 …",
      });
    }
  })
  .transform((value) => normalizeKzPhone(value)!);

export const completeProfileSchema = z.object({
  firstName: personNameSchema,
  lastName: personNameSchema,
  phone: kzPhoneSchema,
  city: z.string().trim().min(1, "Выберите город"),
});

export const profileSettingsSchema = z.object({
  firstName: personNameSchema,
  lastName: personNameSchema,
  phone: kzPhoneSchema,
  city: z.string().trim().min(1, "Выберите город"),
  avatarUrl: z.string().optional(),
});

/** Сохранение профиля: телефон и ФИО валидируются только если поле редактируемо. */
export function parseProfileSettingsSave(input: {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  avatarUrl?: string;
  namesEditable: boolean;
  phoneEditable: boolean;
}):
  | { success: true; data: { firstName: string; lastName: string; phone?: string; city: string; avatarUrl: string } }
  | { success: false; error: string } {
  const cityParsed = z.string().trim().min(1, "Выберите город").safeParse(input.city);
  if (!cityParsed.success) {
    return { success: false, error: firstZodError(cityParsed)! };
  }

  let firstName = input.firstName.trim();
  let lastName = input.lastName.trim();
  if (input.namesEditable) {
    const namesParsed = z
      .object({ firstName: personNameSchema, lastName: personNameSchema })
      .safeParse({ firstName: input.firstName, lastName: input.lastName });
    if (!namesParsed.success) {
      return { success: false, error: firstZodError(namesParsed)! };
    }
    firstName = namesParsed.data.firstName;
    lastName = namesParsed.data.lastName;
  }

  let phone: string | undefined;
  if (input.phoneEditable) {
    const phoneParsed = kzPhoneSchema.safeParse(input.phone);
    if (!phoneParsed.success) {
      return { success: false, error: firstZodError(phoneParsed)! };
    }
    phone = phoneParsed.data;
  }

  return {
    success: true,
    data: {
      firstName,
      lastName,
      phone,
      city: cityParsed.data,
      avatarUrl: input.avatarUrl?.trim() ?? "",
    },
  };
}

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, "Укажите название компании").max(100, "До 100 символов"),
  categories: z.array(z.string()).min(1, "Выберите хотя бы одну категорию"),
  city: z.string().min(1, "Выберите город"),
  description: z.string().max(2000, "Описание до 2000 символов").optional(),
  phone: z.string().max(20, "Телефон до 20 символов").optional(),
  email: z
    .string()
    .optional()
    .refine((v) => !v || v.trim() === "" || z.string().email().safeParse(v.trim()).success, {
      message: "Некорректный email компании",
    }),
  website: z.string().max(200).optional(),
  address: z.string().max(200).optional(),
  bin: z
    .string()
    .optional()
    .refine((v) => !v || v.trim() === "" || /^\d{12}$/.test(v.trim()), {
      message: "БИН должен содержать 12 цифр",
    }),
});

export const reportSchema = z.object({
  reason: z.string().min(1, "Выберите причину"),
  details: z.string().max(2000, "Комментарий до 2000 символов").optional(),
});

export function firstZodError(result: z.SafeParseReturnType<unknown, unknown>): string | null {
  if (result.success) return null;
  return result.error.errors[0]?.message ?? "Проверьте введённые данные";
}
