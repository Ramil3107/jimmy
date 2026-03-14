import { randomUUID } from 'node:crypto';

export interface PendingAction {
  id: string;
  userId: string;
  intent: string;
  params: Record<string, unknown>;
  description: string;
  createdAt: number;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const pending = new Map<string, PendingAction>();

/** Create a pending action and return its ID */
export function setPendingAction(
  userId: string,
  intent: string,
  params: Record<string, unknown>,
  description: string,
): string {
  // Remove any existing pending action for this user
  for (const [id, action] of pending) {
    if (action.userId === userId) {
      pending.delete(id);
    }
  }

  const id = randomUUID();
  pending.set(id, {
    id,
    userId,
    intent,
    params,
    description,
    createdAt: Date.now(),
  });

  return id;
}

/** Get a pending action if it exists and hasn't expired */
export function getPendingAction(actionId: string): PendingAction | null {
  const action = pending.get(actionId);
  if (!action) return null;

  if (Date.now() - action.createdAt > TTL_MS) {
    pending.delete(actionId);
    return null;
  }

  return action;
}

/** Confirm and remove a pending action */
export function confirmPendingAction(actionId: string): PendingAction | null {
  const action = getPendingAction(actionId);
  if (!action) return null;

  pending.delete(actionId);
  return action;
}

/** Cancel and remove a pending action */
export function cancelPendingAction(actionId: string): boolean {
  return pending.delete(actionId);
}

/** Clear all pending actions — used in tests */
export function clearPendingActions(): void {
  pending.clear();
}
