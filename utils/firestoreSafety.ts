/**
 * Firestore query safety: never pass undefined/null to where() — Firestore throws
 * "Unsupported field value: undefined". Use these helpers or guard before building queries.
 */
import { WhereFilterOp, where, QueryConstraint } from 'firebase/firestore';

/**
 * Safe where() — throws if value is undefined or null so the error is caught early
 * instead of inside an onSnapshot loop (which can cause blinking / infinite re-renders).
 */
export function safeWhere(
  field: string,
  operator: WhereFilterOp,
  value: unknown
): QueryConstraint {
  if (value === undefined || value === null) {
    throw new Error(
      `[Firestore] Invalid where() value for field "${field}": ${value}. ` +
        'Guard with e.g. if (!organizationId) return; before building the query.'
    );
  }
  if (typeof value === 'string' && !value.trim()) {
    throw new Error(
      `[Firestore] Empty string where() value for field "${field}". ` +
        'Use a non-empty string or skip the constraint.'
    );
  }
  return where(field, operator, value);
}

/**
 * Returns true if the value is safe to use in a where() clause (not undefined, null, or empty string).
 */
export function isSafeWhereValue(value: unknown): value is string | number | boolean | Date {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string' && !value.trim()) return false;
  return true;
}
