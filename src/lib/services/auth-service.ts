import { isValidDemoLogin } from "@/lib/auth/session";

export interface AuthService {
  login(email: string, password: string): Promise<{ success: boolean; message?: string }>;
  logout(): Promise<void>;
}

export const authService: AuthService = {
  async login(email, password) {
    const valid = isValidDemoLogin(email, password);
    return valid
      ? { success: true }
      : { success: false, message: "Use demo@leadlock.app / demo1234 for the MVP demo." };
  },
  async logout() {
    return Promise.resolve();
  }
};
