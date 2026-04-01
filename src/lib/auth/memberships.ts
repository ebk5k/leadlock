import { DEMO_USER_EMAIL, DEMO_USER_ID, DEMO_USER_NAME } from "@/lib/auth/demo";
import { getPersistenceAdapter } from "@/lib/data/adapter";
import type {
  AuthorizedBusinessSessionContext,
  AuthorizedSession,
  BusinessMembership
} from "@/types/domain";

function getBusinessClientsByIds(businessIds: string[]) {
  return getPersistenceAdapter().business.listBusinessClientsByIds(businessIds);
}

export function findPersistedUserByEmail(email: string) {
  return getPersistenceAdapter().business.findUserByEmail(email);
}

export function findPersistedUserById(userId: string) {
  return getPersistenceAdapter().business.findUserById(userId);
}

export function getPersistedBusinessMembershipsForUser(userId: string) {
  return getPersistenceAdapter().business.listMembershipsForUser(userId);
}

export function getPersistedActiveMembershipsForBusiness(businessId: string) {
  return getPersistenceAdapter().business.listActiveMembershipsForBusiness(businessId);
}

export function ensureDemoUserMembershipSeed() {
  const defaultBusinessClient = getPersistenceAdapter().business.getDefaultBusinessClient();
  const membershipId = `${DEMO_USER_ID}:${defaultBusinessClient.id}`;

  getPersistenceAdapter().business.upsertAuthUser({
    id: DEMO_USER_ID,
    email: DEMO_USER_EMAIL,
    name: DEMO_USER_NAME,
    createdAt: defaultBusinessClient.createdAt
  });

  getPersistenceAdapter().business.upsertMembership({
    id: membershipId,
    userId: DEMO_USER_ID,
    businessId: defaultBusinessClient.id,
    role: "owner",
    status: "active",
    createdAt: defaultBusinessClient.createdAt
  });
}

export function hydrateAuthorizedSessionFromMemberships(
  session: AuthorizedSession | null | undefined,
  requestedBusinessId?: string | null
): AuthorizedBusinessSessionContext {
  const defaultBusinessClient = getPersistenceAdapter().business.getDefaultBusinessClient();

  if (!session) {
    return {
      session: null,
      allowedBusinessClients: [defaultBusinessClient],
      memberships: []
    };
  }

  const persistedUser =
    findPersistedUserById(session.user.id) ?? findPersistedUserByEmail(session.user.email) ?? session.user;
  const memberships = getPersistedBusinessMembershipsForUser(persistedUser.id);

  const membershipBusinessIds = memberships.map((membership) => membership.businessId);
  const sessionBusinessIds = Array.from(new Set(session.allowedBusinessIds.filter(Boolean)));
  const fallbackAllowedBusinessIds =
    sessionBusinessIds.length > 0 ? sessionBusinessIds : [defaultBusinessClient.id];
  const allowedBusinessIds = membershipBusinessIds.length > 0 ? membershipBusinessIds : fallbackAllowedBusinessIds;
  const allowedBusinessClients =
    memberships.length > 0
      ? memberships.map((membership) => membership.businessClient)
      : getBusinessClientsByIds(allowedBusinessIds);
  const normalizedAllowedBusinessClients =
    allowedBusinessClients.length > 0 ? allowedBusinessClients : [defaultBusinessClient];
  const normalizedAllowedBusinessIds = normalizedAllowedBusinessClients.map((business) => business.id);
  const normalizedRequestedBusinessId = requestedBusinessId?.trim();
  const requestedActiveBusinessId =
    normalizedRequestedBusinessId && normalizedAllowedBusinessIds.includes(normalizedRequestedBusinessId)
      ? normalizedRequestedBusinessId
      : session.activeBusinessId;
  const activeBusinessId = normalizedAllowedBusinessIds.includes(requestedActiveBusinessId)
    ? requestedActiveBusinessId
    : normalizedAllowedBusinessIds[0];

  return {
    session: {
      user: persistedUser,
      allowedBusinessIds: normalizedAllowedBusinessIds,
      activeBusinessId
    },
    allowedBusinessClients: normalizedAllowedBusinessClients,
    memberships
  };
}
