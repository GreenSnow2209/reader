import { PaginationConfig } from '../engine/types';

/**
 * Text and block measurement utility.
 * In a real browser environment, it uses a hidden offscreen container with accurate getBoundingClientRect().
 * In headless/Node environments (like unit tests), it provides mathematically sound layout estimation.
 */
export class DomMeasurer {
  private static measurementContainer: HTMLElement | null = null;

  static initContainer(): HTMLElement {
    if (typeof document === 'undefined') {
      return {} as HTMLElement;
    }

    if (!this.measurementContainer) {
      this.measurementContainer = document.createElement('div');
      this.measurementContainer.id = 'lumina-measurer';
      this.measurementContainer.style.position = 'absolute';
      this.measurementContainer.style.visibility = 'hidden';
      this.measurementContainer.style.left = '-9999px';
      this.measurementContainer.style.top = '-9999px';
      this.measurementContainer.style.pointerEvents = 'none';
      document.body.appendChild(this.measurementContainer);
    }
    return this.measurementContainer;
  }

  /**
   * Estimates the height of a block element based on text length and styling.
   */
  static measureBlock(
    html: string,
    text: string,
    config: PaginationConfig,
    availableWidth: number
  ): number {
    const container = this.initContainer();

    // In a browser with real layout engine:
    if (container && container.style && typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
      container.style.width = `${Math.max(200, availableWidth)}px`;
      container.style.fontSize = `${config.fontSize}px`;
      container.style.lineHeight = `${config.lineHeight}`;
      container.style.fontFamily = config.fontFamily;
      container.innerHTML = html;

      const rect = container.getBoundingClientRect();
      if (rect.height > 0) {
        return Math.ceil(rect.height) + 16; // Add margin bottom
      }
    }

    // Fallback analytical calculation:
    // Average character width is ~0.55 of font size for proportional serif/sans fonts
    const avgCharWidth = config.fontSize * 0.52;
    const charsPerLine = Math.max(20, Math.floor(availableWidth / avgCharWidth));
    const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
    const lineHeightPx = config.fontSize * config.lineHeight;

    // Heading tags get extra height
    const isHeading = /<h[1-6]/i.test(html);
    const extraMargin = isHeading ? config.fontSize * 1.5 : 16;

    return Math.ceil(lines * lineHeightPx + extraMargin);
  }

  /**
   * Calculates maximum inner page dimensions based on viewport and configuration.
   */
  static getPageInnerDimensions(config: PaginationConfig): { width: number; height: number } {
    const rawWidth = config.isDualPage ? config.viewportWidth / 2 : config.viewportWidth;
    const innerWidth = Math.max(260, rawWidth - config.margin * 2 - 24);
    // Reserve ~90px for reader header, chapter title, page numbers, and margin
    const innerHeight = Math.max(300, config.viewportHeight - config.margin * 2 - 96);

    return {
      width: Math.floor(innerWidth),
      height: Math.floor(innerHeight),
    };
  }
}
