import { z } from "zod";

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
  name: z
    .string()
    .trim()
    .min(2, "Имя — минимум 2 символа")
    .max(80, "Имя слишком длинное"),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["client", "contractor", "supplier"], {
    errorMap: () => ({ message: "Выберите тип аккаунта" }),
  }),
});

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
});

export const reportSchema = z.object({
  reason: z.string().min(1, "Выберите причину"),
  details: z.string().max(2000, "Комментарий до 2000 символов").optional(),
});

export function firstZodError(result: z.SafeParseReturnType<unknown, unknown>): string | null {
  if (result.success) return null;
  return result.error.errors[0]?.message ?? "Проверьте введённые данные";
}
