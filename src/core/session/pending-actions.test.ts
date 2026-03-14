import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setPendingAction,
  getPendingAction,
  confirmPendingAction,
  cancelPendingAction,
  clearPendingActions,
} from './pending-actions.js';

beforeEach(() => {
  clearPendingActions();
  vi.restoreAllMocks();
});

describe('setPendingAction', () => {
  it('creates a pending action and returns an ID', () => {
    const id = setPendingAction('user-1', 'create_task', { title: 'test' }, 'Create task: test');
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('replaces existing pending action for same user', () => {
    const id1 = setPendingAction('user-1', 'create_task', {}, 'first');
    const id2 = setPendingAction('user-1', 'delete_task', {}, 'second');

    expect(getPendingAction(id1)).toBeNull();
    expect(getPendingAction(id2)).not.toBeNull();
  });
});

describe('getPendingAction', () => {
  it('returns action when valid', () => {
    const id = setPendingAction('user-1', 'create_task', { title: 'test' }, 'Create task');
    const action = getPendingAction(id);

    expect(action).not.toBeNull();
    expect(action!.intent).toBe('create_task');
    expect(action!.params).toEqual({ title: 'test' });
    expect(action!.userId).toBe('user-1');
  });

  it('returns null for nonexistent ID', () => {
    expect(getPendingAction('fake-id')).toBeNull();
  });

  it('returns null for expired action', () => {
    const id = setPendingAction('user-1', 'create_task', {}, 'test');

    // Advance time past TTL (5 min)
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60 * 1000);

    expect(getPendingAction(id)).toBeNull();
  });
});

describe('confirmPendingAction', () => {
  it('returns and removes the action', () => {
    const id = setPendingAction('user-1', 'create_task', {}, 'test');

    const action = confirmPendingAction(id);
    expect(action).not.toBeNull();
    expect(action!.intent).toBe('create_task');

    // Should be gone now
    expect(getPendingAction(id)).toBeNull();
  });

  it('returns null for expired action', () => {
    const id = setPendingAction('user-1', 'create_task', {}, 'test');
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60 * 1000);

    expect(confirmPendingAction(id)).toBeNull();
  });
});

describe('cancelPendingAction', () => {
  it('removes the action and returns true', () => {
    const id = setPendingAction('user-1', 'create_task', {}, 'test');
    expect(cancelPendingAction(id)).toBe(true);
    expect(getPendingAction(id)).toBeNull();
  });

  it('returns false for nonexistent ID', () => {
    expect(cancelPendingAction('fake-id')).toBe(false);
  });
});
