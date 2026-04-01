import type { AuthenticatedUserIdentity } from "@/types/domain";

export const DEMO_USER_ID = "demo-user";
export const DEMO_USER_EMAIL = "demo@leadlock.app";
export const DEMO_USER_NAME = "LeadLock Demo";

export const DEMO_USER: AuthenticatedUserIdentity = {
  id: DEMO_USER_ID,
  email: DEMO_USER_EMAIL,
  name: DEMO_USER_NAME
};
