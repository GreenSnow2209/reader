export type ThemeName = 'sepia' | 'dark' | 'light';
export type FontFamilyType = 'serif' | 'sans';

export interface ReaderSettings {
  theme: ThemeName;
  fontSize: number;
  lineHeight: number;
  margin: number;
  fontFamily: FontFamilyType;
  isDualPage: boolean;
  volumeKeysEnabled: boolean;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'sepia',
  fontSize: 16,
  lineHeight: 1.65,
  margin: 36,
  fontFamily: 'serif',
  isDualPage: true,
  volumeKeysEnabled: true,
};

const STORAGE_KEY = 'lumina_reader_settings';

export class ThemeManager {
  private settings: ReaderSettings;
  private listeners: Array<(settings: ReaderSettings) => void> = [];

  constructor() {
    this.settings = this.loadSettings();
    this.applyToDom();
  }

  getSettings(): ReaderSettings {
    return { ...this.settings };
  }

  updateSettings(partial: Partial<ReaderSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
    this.applyToDom();
    this.notifyListeners();
  }

  setTheme(theme: ThemeName): void {
    this.updateSettings({ theme });
  }

  setFontSize(size: number): void {
    const clamped = Math.max(12, Math.min(size, 32));
    this.updateSettings({ fontSize: clamped });
  }

  setLineHeight(height: number): void {
    const clamped = Math.max(1.2, Math.min(height, 2.4));
    this.updateSettings({ lineHeight: clamped });
  }

  setMargin(margin: number): void {
    const clamped = Math.max(16, Math.min(margin, 72));
    this.updateSettings({ margin: clamped });
  }

  setFontFamily(family: FontFamilyType): void {
    this.updateSettings({ fontFamily: family });
  }

  setDualPage(isDualPage: boolean): void {
    this.updateSettings({ isDualPage });
  }

  subscribe(listener: (settings: ReaderSettings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.getSettings());
    }
  }

  private loadSettings(): ReaderSettings {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private saveSettings(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // ignore quota error
    }
  }

  applyToDom(): void {
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.classList.remove('theme-sepia', 'theme-dark', 'theme-light');
    body.classList.add(`theme-${this.settings.theme}`);

    const root = document.documentElement;
    root.style.setProperty('--font-size', `${this.settings.fontSize}px`);
    root.style.setProperty('--line-height', `${this.settings.lineHeight}`);
    root.style.setProperty('--book-margin', `${this.settings.margin}px`);

    const fontVal =
      this.settings.fontFamily === 'serif'
        ? "'Lora', Georgia, serif"
        : "'Plus Jakarta Sans', system-ui, sans-serif";
    root.style.setProperty('--font-family', fontVal);
  }
}
