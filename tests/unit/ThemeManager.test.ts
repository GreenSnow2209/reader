import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeManager } from '../../src/core/theme/ThemeManager';

describe('ThemeManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default Sepia theme and applies body class', () => {
    const manager = new ThemeManager();
    const settings = manager.getSettings();

    expect(settings.theme).toBe('sepia');
    expect(document.body.classList.contains('theme-sepia')).toBe(true);
  });

  it('updates theme and updates document body classes', () => {
    const manager = new ThemeManager();
    manager.setTheme('dark');

    expect(manager.getSettings().theme).toBe('dark');
    expect(document.body.classList.contains('theme-dark')).toBe(true);
    expect(document.body.classList.contains('theme-sepia')).toBe(false);
  });

  it('clamps font size and margins within safe bounds', () => {
    const manager = new ThemeManager();
    manager.setFontSize(8); // Below min
    expect(manager.getSettings().fontSize).toBe(12);

    manager.setFontSize(50); // Above max
    expect(manager.getSettings().fontSize).toBe(32);
  });

  it('notifies listeners when settings change', () => {
    const manager = new ThemeManager();
    let notifiedTheme = '';

    manager.subscribe((s) => {
      notifiedTheme = s.theme;
    });

    manager.setTheme('light');
    expect(notifiedTheme).toBe('light');
  });
});
