import { resolveActiveBusinessContext, sessionMayAccessBusiness } from "@/lib/business-context";
import { getDatabase } from "@/lib/data/database";

type GuardedTable =
  | "leads"
  | "appointments"
  | "payments"
  | "employees"
  | "outbound_messages"
  | "calls";

interface GuardFailureOptions {
  action: string;
  details: string;
}

export class BusinessGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessGuardError";
  }
}

function logGuardFailure({ action, details }: GuardFailureOptions) {
  console.warn(`[business-guard] blocked ${action}: ${details}`);
}

function getRecordLookup(table: GuardedTable) {
  switch (table) {
    case "leads":
    case "appointments":
    case "payments":
    case "employees":
    case "outbound_messages":
    case "calls":
      return `SELECT id, business_id FROM ${table} WHERE id = ? LIMIT 1`;
    default:
      return null;
  }
}

function businessClientExists(businessId: string) {
  const row = getDatabase()
    .prepare(
      `
        SELECT id
        FROM business_clients
        WHERE id = ?
        LIMIT 1
      `
    )
    .get(businessId) as { id?: string } | undefined;

  return Boolean(row?.id);
}

export function getRecordBusinessAssociation(table: GuardedTable, recordId: string) {
  const query = getRecordLookup(table);

  if (!query) {
    return null;
  }

  const row = getDatabase()
    .prepare(query)
    .get(recordId) as { id?: string; business_id?: string } | undefined;

  if (!row?.id || !row.business_id) {
    return null;
  }

  return {
    id: row.id,
    businessId: row.business_id
  };
}

export async function resolveGuardedBusinessScope(input: {
  action: string;
  requestedBusinessId?: string | null;
  associatedBusinessId?: string | null;
}) {
  const activeContext = await resolveActiveBusinessContext();
  const requestedBusinessId = input.requestedBusinessId?.trim() || undefined;
  const associatedBusinessId = input.associatedBusinessId?.trim() || undefined;

  if (requestedBusinessId && associatedBusinessId && requestedBusinessId !== associatedBusinessId) {
    logGuardFailure({
      action: input.action,
      details: `requested business ${requestedBusinessId} did not match associated business ${associatedBusinessId}`
    });
    throw new BusinessGuardError("Business scope mismatch for requested mutation.");
  }

  if (requestedBusinessId && !businessClientExists(requestedBusinessId)) {
    logGuardFailure({
      action: input.action,
      details: `requested business ${requestedBusinessId} does not exist`
    });
    throw new BusinessGuardError("Requested business is not recognized.");
  }

  if (requestedBusinessId && !(await sessionMayAccessBusiness(requestedBusinessId))) {
    logGuardFailure({
      action: input.action,
      details: `requested business ${requestedBusinessId} is not authorized for the active session context`
    });
    throw new BusinessGuardError("Requested business is not authorized for this session.");
  }

  if (requestedBusinessId && requestedBusinessId !== activeContext.businessId) {
    logGuardFailure({
      action: input.action,
      details: `requested business ${requestedBusinessId} did not match active business ${activeContext.businessId}`
    });
    throw new BusinessGuardError("Requested business does not match the active business context.");
  }

  if (associatedBusinessId && !(await sessionMayAccessBusiness(associatedBusinessId))) {
    logGuardFailure({
      action: input.action,
      details: `associated business ${associatedBusinessId} is not authorized for the active session context`
    });
    throw new BusinessGuardError("Record business is not authorized for this session.");
  }

  if (associatedBusinessId && associatedBusinessId !== activeContext.businessId) {
    logGuardFailure({
      action: input.action,
      details: `associated business ${associatedBusinessId} did not match active business ${activeContext.businessId}`
    });
    throw new BusinessGuardError("Record business does not match the active business context.");
  }

  return requestedBusinessId ?? associatedBusinessId ?? activeContext.businessId;
}

export async function assertRecordInBusiness(input: {
  action: string;
  table: GuardedTable;
  recordId: string;
  expectedBusinessId: string;
}) {
  const association = getRecordBusinessAssociation(input.table, input.recordId);

  if (!association) {
    logGuardFailure({
      action: input.action,
      details: `record ${input.recordId} was not found in ${input.table}`
    });
    throw new BusinessGuardError("Referenced record was not found.");
  }

  if (association.businessId !== input.expectedBusinessId) {
    logGuardFailure({
      action: input.action,
      details: `record ${input.recordId} in ${input.table} belongs to ${association.businessId}, expected ${input.expectedBusinessId}`
    });
    throw new BusinessGuardError("Referenced record does not belong to the active business.");
  }

  return association;
}
