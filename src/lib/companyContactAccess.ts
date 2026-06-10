/** Контакты, адрес и БИН — только для авторизованных пользователей. */
export function canViewCompanyPrivateDetails(isAuthenticated: boolean): boolean {
  return isAuthenticated;
}

export const COMPANY_PRIVATE_DETAILS_GUEST_HINT =
  "Войдите, чтобы увидеть контакты, адрес и БИН компании.";
