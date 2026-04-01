import { headers, cookies } from "next/headers";

import { hydrateAuthorizedSessionFromMemberships } from "@/lib/auth/memberships";
import {
  parseAuthorizedSession,
  SESSION_COOKIE,
  sessionAllowsBusiness
} from "@/lib/auth/session";
import { getPersistenceAdapter } from "@/lib/data/adapter";
import type { ActiveBusinessContext, AuthorizedBusinessSessionContext, BusinessClient } from "@/types/domain";

export const ACTIVE_BUSINESS_COOKIE = "leadlock_business";
export const ACTIVE_BUSINESS_HEADER = "x-leadlock-business-id";

function getDefaultBusinessClient(): BusinessClient {
  return getPersistenceAdapter().business.getDefaultBusinessClient();
}

function findBusinessClientById(businessId: string) {
  return getPersistenceAdapter().business.findBusinessClientById(businessId);
}

async function readRequestedBusinessId() {
  try {
    const headerStore = await headers();
    const headerBusinessId = headerStore.get(ACTIVE_BUSINESS_HEADER)?.trim();

    if (headerBusinessId) {
      return headerBusinessId;
    }
  } catch {}

  try {
    const cookieStore = await cookies();
    const cookieBusinessId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value?.trim();

    if (cookieBusinessId) {
      return cookieBusinessId;
    }
  } catch {}

  return null;
}

async function readSessionValue() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE)?.value?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function sessionMayAccessBusiness(requestedBusinessId: string) {
  const defaultBusinessClient = getDefaultBusinessClient();
  const authorizedContext = await resolveAuthorizedSessionContext();
  const session = authorizedContext.session;

  if (!session) {
    return requestedBusinessId === defaultBusinessClient.id;
  }

  return sessionAllowsBusiness(session, requestedBusinessId);
}

export async function resolveAuthorizedSessionContext(): Promise<AuthorizedBusinessSessionContext> {
  const defaultBusinessClient = getDefaultBusinessClient();
  const sessionValue = await readSessionValue();
  const session = parseAuthorizedSession(sessionValue, defaultBusinessClient.id);
  const requestedBusinessId = await readRequestedBusinessId();

  return hydrateAuthorizedSessionFromMemberships(session, requestedBusinessId);
}

export async function resolveActiveBusinessContext(): Promise<ActiveBusinessContext> {
  const defaultBusinessClient = getDefaultBusinessClient();
  const requestedBusinessId = await readRequestedBusinessId();
  const authorizedContext = await resolveAuthorizedSessionContext();
  const session = authorizedContext.session;

  if (session) {
    const businessClient =
      authorizedContext.allowedBusinessClients.find((client) => client.id === session.activeBusinessId) ??
      findBusinessClientById(session.activeBusinessId);

    if (businessClient) {
      const source = requestedBusinessId?.trim() === session.activeBusinessId ? "request" : "session";

      return {
        businessId: businessClient.id,
        businessClient,
        source
      };
    }
  }

  if (requestedBusinessId && requestedBusinessId === defaultBusinessClient.id) {
    const businessClient = findBusinessClientById(requestedBusinessId);

    if (businessClient) {
      return {
        businessId: businessClient.id,
        businessClient,
        source: "request"
      };
    }
  }

  return {
    businessId: defaultBusinessClient.id,
    businessClient: defaultBusinessClient,
    source: "default"
  };
}

export async function resolveActiveBusinessId() {
  const context = await resolveActiveBusinessContext();
  return context.businessId;
}
