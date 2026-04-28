import { describe, expect, it } from 'vitest';
import { appendToastItem, removeToastItemById, TOAST_AUTO_DISMISS_MS } from '../src/ui/ToastContext';

describe('toast behavior helpers', () => {
  it('appends success/error toasts and keeps deterministic order', () => {
    const next = appendToastItem([], { id: 't1', type: 'success', message: 'Created' });
    const finalList = appendToastItem(next, { id: 't2', type: 'error', message: 'Failed' });

    expect(finalList).toEqual([
      { id: 't1', type: 'success', message: 'Created' },
      { id: 't2', type: 'error', message: 'Failed' }
    ]);
  });

  it('removes toast by id and keeps others for auto-dismiss', () => {
    const current = [
      { id: 't1', type: 'success' as const, message: 'Created' },
      { id: 't2', type: 'error' as const, message: 'Conflict' }
    ];
    expect(removeToastItemById(current, 't2')).toEqual([{ id: 't1', type: 'success', message: 'Created' }]);
    expect(TOAST_AUTO_DISMISS_MS).toBeGreaterThan(0);
  });
});
