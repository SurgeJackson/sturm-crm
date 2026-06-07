export const authErrorMessages: Record<string, string> = {
  CredentialsSignin: "Неверный email или пароль.",
  INVALID_CREDENTIALS: "Неверный email или пароль.",
  EMAIL_NOT_VERIFIED: "Email не подтвержден.",
  USER_NOT_ACTIVE: "Доступ к CRM не активирован. Обратитесь к руководителю.",
  USER_DEACTIVATED: "Пользователь деактивирован.",
  USER_LOCKED: "Вход временно заблокирован. Попробуйте позже."
};

export class AuthFlowError extends Error {
  code: string;

  constructor(code: keyof typeof authErrorMessages) {
    super(authErrorMessages[code]);
    this.name = "AuthFlowError";
    this.code = code;
  }
}
