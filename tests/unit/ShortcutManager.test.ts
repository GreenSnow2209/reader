import { describe, it, expect } from 'vitest';
import { ShortcutManager } from '../../src/core/input/ShortcutManager';

describe('ShortcutManager', () => {
  it('triggers next and prev page on desktop arrow keys', () => {
    let nextCount = 0;
    let prevCount = 0;

    const manager = new ShortcutManager({
      onNextPage: () => nextCount++,
      onPrevPage: () => prevCount++,
    });

    // ArrowRight
    manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(nextCount).toBe(1);

    // ArrowDown
    manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(nextCount).toBe(2);

    // ArrowLeft
    manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(prevCount).toBe(1);

    // ArrowUp
    manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(prevCount).toBe(2);
  });

  it('triggers page flips on mobile volume keys', () => {
    let nextCount = 0;
    let prevCount = 0;

    const manager = new ShortcutManager({
      onNextPage: () => nextCount++,
      onPrevPage: () => prevCount++,
    });

    manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'VolumeDown' }));
    expect(nextCount).toBe(1);

    manager.handleKeyDown(new KeyboardEvent('keydown', { key: 'VolumeUp' }));
    expect(prevCount).toBe(1);
  });

  it('ignores keys when typing inside an input element', () => {
    let nextCount = 0;
    const manager = new ShortcutManager({
      onNextPage: () => nextCount++,
      onPrevPage: () => {},
    });

    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    Object.defineProperty(event, 'target', { value: input, enumerable: true });

    manager.handleKeyDown(event);
    expect(nextCount).toBe(0);
  });
});
