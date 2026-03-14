import { describe, it, expect } from 'vitest';
import { mockRouteMessage } from './mock-router.js';
import type { RoutingContext } from './types.js';

const context: RoutingContext = {
  user_name: 'Test',
  language: 'en',
  timezone: 'UTC',
  current_time: '2026-03-14T12:00:00Z',
  available_skills: [],
  recent_messages: [],
};

describe('mockRouteMessage', () => {
  it('routes "help" to help intent', () => {
    const result = mockRouteMessage('help', context);
    expect(result.intent).toBe('help');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('routes "what can you do" to help intent', () => {
    const result = mockRouteMessage('what can you do', context);
    expect(result.intent).toBe('help');
  });

  it('routes task-related messages', () => {
    const result = mockRouteMessage('remind me to call mom', context);
    expect(result.intent).toBe('create_task');
    expect(result.params).toEqual({ title: 'call mom' });
  });

  it('routes "show my tasks" to list_tasks with today view', () => {
    const result = mockRouteMessage('show my tasks', context);
    expect(result.intent).toBe('list_tasks');
    expect(result.params).toEqual({ view: 'today' });
  });

  it('routes "show all tasks" to list_tasks with all view', () => {
    const result = mockRouteMessage('show all my tasks', context);
    expect(result.intent).toBe('list_tasks');
    expect(result.params).toEqual({ view: 'all' });
  });

  it('routes "weekly tasks" to list_tasks with week view', () => {
    const result = mockRouteMessage('show my weekly tasks', context);
    expect(result.intent).toBe('list_tasks');
    expect(result.params).toEqual({ view: 'week' });
  });

  it('routes "mark X as done" to complete_task with title_query', () => {
    const result = mockRouteMessage('mark call mom as done', context);
    expect(result.intent).toBe('complete_task');
    expect(result.params).toHaveProperty('title_query', 'call mom');
  });

  it('routes "delete X task" to delete_task with title_query', () => {
    const result = mockRouteMessage('delete the grocery task', context);
    expect(result.intent).toBe('delete_task');
    expect(result.params).toHaveProperty('title_query', 'grocery');
  });

  it('routes note-related messages', () => {
    const result = mockRouteMessage('remember this recipe', context);
    expect(result.intent).toBe('create_note');
  });

  it('routes calendar-related messages', () => {
    const result = mockRouteMessage('what meetings do I have', context);
    expect(result.intent).toBe('list_events');
  });

  it('defaults to chat for general messages', () => {
    const result = mockRouteMessage('hello how are you', context);
    expect(result.intent).toBe('chat');
    expect(result.response_text).toContain('Test');
  });

  it('always returns valid IntentResult shape', () => {
    const result = mockRouteMessage('random stuff', context);
    expect(result).toHaveProperty('intent');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('params');
    expect(result).toHaveProperty('response_text');
  });
});
