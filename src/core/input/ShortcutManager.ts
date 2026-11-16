export interface ShortcutCallbacks {
  onNextPage: () => void;
  onPrevPage: () => void;
  onToggleMenu?: () => void;
  onToggleFullscreen?: () => void;
  onCloseOverlay?: () => void;
}

export class ShortcutManager {
  private callbacks: ShortcutCallbacks;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private isEnabled = true;
  private volumeKeysEnabled = true;

  constructor(callbacks: ShortcutCallbacks) {
    this.callbacks = callbacks;
    this.setupListeners();
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  setVolumeKeysEnabled(enabled: boolean): void {
    this.volumeKeysEnabled = enabled;
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    window.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  handleKeyDown(e: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Ignore keydown if user is typing in an input or textarea
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      if (e.key === 'Escape') {
        this.callbacks.onCloseOverlay?.();
      }
      return;
    }

    // 1. Desktop Arrow Keys & Paging
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        this.callbacks.onNextPage();
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        this.callbacks.onPrevPage();
        break;

      case ' ':
        e.preventDefault();
        if (e.shiftKey) {
          this.callbacks.onPrevPage();
        } else {
          this.callbacks.onNextPage();
        }
        break;

      case 'Escape':
        this.callbacks.onCloseOverlay?.();
        break;

      case 'F11':
        e.preventDefault();
        this.callbacks.onToggleFullscreen?.();
        break;
    }

    // 2. Mobile Volume Keys (VolumeUp / VolumeDown)
    if (this.volumeKeysEnabled) {
      if (e.key === 'VolumeDown' || e.key === 'AudioVolumeDown' || e.code === 'AudioVolumeDown') {
        e.preventDefault();
        this.callbacks.onNextPage();
      } else if (e.key === 'VolumeUp' || e.key === 'AudioVolumeUp' || e.code === 'AudioVolumeUp') {
        e.preventDefault();
        this.callbacks.onPrevPage();
      }
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    if (!this.isEnabled || e.touches.length !== 1) return;
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchStartTime = Date.now();
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (!this.isEnabled || e.changedTouches.length !== 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchDuration = Date.now() - this.touchStartTime;

    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;

    // Detect horizontal swipe (horizontal movement > 50px and greater than vertical movement)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) && touchDuration < 600) {
      if (deltaX < 0) {
        // Swipe left -> Next page
        this.callbacks.onNextPage();
      } else {
        // Swipe right -> Prev page
        this.callbacks.onPrevPage();
      }
      return;
    }

    // Detect quick tap (movement < 15px, duration < 300ms)
    if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15 && touchDuration < 300) {
      const windowWidth = window.innerWidth;
      const tapXRatio = touchEndX / windowWidth;

      if (tapXRatio < 0.22) {
        // Left zone: Previous page
        this.callbacks.onPrevPage();
      } else if (tapXRatio > 0.78) {
        // Right zone: Next page
        this.callbacks.onNextPage();
      } else {
        // Center zone: Toggle toolbar menu
        this.callbacks.onToggleMenu?.();
      }
    }
  }

  destroy(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    window.removeEventListener('touchend', this.handleTouchEnd.bind(this));
  }
}
