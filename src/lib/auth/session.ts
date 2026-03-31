export const SESSION_COOKIE = "leadlock_session";
export const SESSION_VALUE = "leadlock_demo_authenticated";
export const SESSION_MAX_AGE = 60 * 60 * 24;

export function isValidDemoLogin(email: string, password: string) {
  return email === "demo@leadlock.app" && password === "demo1234";
}

export function hasValidSession(sessionValue?: string) {
  return sessionValue === SESSION_VALUE;
}
