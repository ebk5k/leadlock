import { DEMO_USER } from "@/lib/auth/demo";
import type { AuthenticatedUserIdentity, AuthorizedSession } from "@/types/domain";

export const SESSION_COOKIE = "leadlock_session";
export const SESSION_VALUE = "leadlock_demo_authenticated";
export const SESSION_MAX_AGE = 60 * 60 * 24;
export const SESSION_BUSINESS_MAX_AGE = SESSION_MAX_AGE;

const DEFAULT_FALLBACK_BUSINESS_ID = "default-business";

function encodeSessionPayload(value: string) {
  if (typeof globalThis.btoa === "function") {
    return globalThis
      .btoa(value)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeSessionPayload(value: string) {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalizedValue.length % 4)) % 4;
  const paddedValue = normalizedValue.padEnd(normalizedValue.length + paddingLength, "=");

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(paddedValue);
  }

  return Buffer.from(value, "base64url").toString("utf8");
}

function normalizeBusinessIds(value: unknown, fallbackBusinessId: string) {
  if (!Array.isArray(value)) {
    return [fallbackBusinessId];
  }

  const ids = value
    .map((businessId) => String(businessId).trim())
    .filter(Boolean);

  return ids.length > 0 ? Array.from(new Set(ids)) : [fallbackBusinessId];
}

export function isValidDemoLogin(email: string, password: string) {
  return email === "demo@leadlock.app" && password === "demo1234";
}

export function createAuthorizedSession(input?: {
  user?: AuthenticatedUserIdentity;
  allowedBusinessIds?: string[];
  activeBusinessId?: string;
}): AuthorizedSession {
  const fallbackBusinessId = DEFAULT_FALLBACK_BUSINESS_ID;
  const allowedBusinessIds = normalizeBusinessIds(input?.allowedBusinessIds, fallbackBusinessId);
  const requestedActiveBusinessId = input?.activeBusinessId?.trim();
  const activeBusinessId =
    requestedActiveBusinessId && allowedBusinessIds.includes(requestedActiveBusinessId)
      ? requestedActiveBusinessId
      : allowedBusinessIds[0];

  return {
    user: { ...(input?.user ?? DEMO_USER) },
    allowedBusinessIds,
    activeBusinessId
  };
}

export function serializeAuthorizedSession(session: AuthorizedSession) {
  return encodeSessionPayload(JSON.stringify(session));
}

export function parseAuthorizedSession(
  sessionValue?: string | null,
  fallbackBusinessId = DEFAULT_FALLBACK_BUSINESS_ID
): AuthorizedSession | null {
  if (!sessionValue) {
    return null;
  }

  if (sessionValue === SESSION_VALUE) {
    return createAuthorizedSession({
      allowedBusinessIds: [fallbackBusinessId],
      activeBusinessId: fallbackBusinessId
    });
  }

  try {
    const parsed = JSON.parse(decodeSessionPayload(sessionValue)) as Partial<AuthorizedSession> & {
      user?: Partial<AuthorizedSession["user"]>;
    };

    if (!parsed.user?.id || !parsed.user.email) {
      return null;
    }

    const allowedBusinessIds = normalizeBusinessIds(parsed.allowedBusinessIds, fallbackBusinessId);
    const requestedActiveBusinessId = parsed.activeBusinessId?.trim();
    const activeBusinessId =
      requestedActiveBusinessId && allowedBusinessIds.includes(requestedActiveBusinessId)
        ? requestedActiveBusinessId
        : allowedBusinessIds[0];

    return {
      user: {
        id: String(parsed.user.id),
        email: String(parsed.user.email),
        name: String(parsed.user.name ?? DEMO_USER.name)
      },
      allowedBusinessIds,
      activeBusinessId
    };
  } catch {
    return null;
  }
}

export function hasValidSession(sessionValue?: string | null) {
  return parseAuthorizedSession(sessionValue) !== null;
}

export function sessionAllowsBusiness(
  session: AuthorizedSession | null | undefined,
  businessId?: string | null
) {
  if (!session || !businessId) {
    return false;
  }

  return session.allowedBusinessIds.includes(businessId);
}

export function resolveAuthorizedBusinessIdForSession(
  session: AuthorizedSession | null | undefined,
  requestedBusinessId?: string | null
) {
  if (!session) {
    return null;
  }

  const normalizedRequestedBusinessId = requestedBusinessId?.trim();

  if (normalizedRequestedBusinessId && sessionAllowsBusiness(session, normalizedRequestedBusinessId)) {
    return normalizedRequestedBusinessId;
  }

  if (sessionAllowsBusiness(session, session.activeBusinessId)) {
    return session.activeBusinessId;
  }

  return session.allowedBusinessIds[0] ?? null;
}

export function updateSessionActiveBusiness(
  session: AuthorizedSession,
  activeBusinessId: string
): AuthorizedSession {
  return {
    user: session.user,
    allowedBusinessIds: session.allowedBusinessIds,
    activeBusinessId: resolveAuthorizedBusinessIdForSession(session, activeBusinessId) ?? session.activeBusinessId
  };
}
