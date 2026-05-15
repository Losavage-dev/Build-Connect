export type UserRole = "client" | "contractor" | "supplier";
export type StaffRole = "moderator" | "admin";
export type AppRole = UserRole | StaffRole;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  client: "Заказчик",
  contractor: "Подрядчик",
  supplier: "Поставщик",
};

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  moderator: "Модератор",
  admin: "Администратор",
};

export const USER_ROLE_HINTS: Record<UserRole, string> = {
  client: "Тендеры, заявки в каталог, заказ услуг и материалов",
  contractor: "Компания в каталоге, услуги, отклики на тендеры — и вы тоже можете заказывать",
  supplier: "Витрина материалов, заявки от покупателей — и вы тоже можете заказывать у других",
};

export function isStaffRole(role: string | undefined | null): role is StaffRole {
  return role === "moderator" || role === "admin";
}

export const REGISTRATION_ROLE_NOTE =
  "Роль — это ваш основной сценарий, а не жёсткое ограничение: с любой ролью можно заказывать; для продажи и откликов на тендеры понадобится компания в профиле.";
