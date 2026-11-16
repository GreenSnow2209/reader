import { PageFlip } from 'page-flip';
import { VirtualPage } from '../../core/engine/types';

export interface PageFlipViewOptions {
  onPageChange?: (pageNumber: number, totalPages: number) => void;
  isDualPage?: boolean;
}

export class PageFlipView {
  private container: HTMLElement;
  private flipContainer: HTMLElement | null = null;
  private pageFlip: PageFlip | null = null;
  private pages: VirtualPage[] = [];
  private options: PageFlipViewOptions;
  private currentPage = 1;

  constructor(container: HTMLElement, options: PageFlipViewOptions = {}) {
    this.container = container;
    this.options = options;
  }

  setPages(pages: VirtualPage[], initialPage = 1): void {
    this.pages = pages;
    this.currentPage = Math.max(1, Math.min(initialPage, pages.length));
    this.render();
  }

  private render(): void {
    this.destroy();

    if (this.pages.length === 0) {
      this.container.innerHTML = `
        <div class="empty-book-placeholder">
          <p>Không có nội dung để hiển thị.</p>
        </div>
      `;
      return;
    }

    // Measure container size
    const containerRect = this.container.getBoundingClientRect();
    const availWidth = containerRect.width > 0 ? containerRect.width : window.innerWidth;
    const availHeight = containerRect.height > 0 ? containerRect.height : window.innerHeight - 104;

    // Strict adaptive condition: only use 2 pages if screen is truly wide (>= 1050px) AND landscape ratio AND enabled
    const isDual = availWidth >= 1050 && availWidth >= availHeight * 1.15 && (this.options.isDualPage ?? false);

    // Standard book proportions: occupy ~88% of available viewport height
    const pageHeight = Math.max(450, Math.floor(availHeight * 0.88));
    const maxSingleWidth = Math.floor(availWidth * 0.88);
    const maxDualWidth = Math.floor((availWidth * 0.94) / 2);

    const pageWidth = isDual
      ? Math.min(maxDualWidth, Math.max(340, Math.floor(pageHeight * 0.72)))
      : Math.min(maxSingleWidth, Math.max(340, Math.floor(pageHeight * 0.72)));

    this.container.innerHTML = `
      <div class="flip-book-wrapper">
        <div id="book-viewport" class="flip-book-container"></div>
      </div>
    `;

    this.flipContainer = this.container.querySelector('#book-viewport');
    if (!this.flipContainer) return;

    // Set explicit size on flipContainer so PageFlip centers cleanly with no negative offset
    const totalBookWidth = isDual ? pageWidth * 2 : pageWidth;
    this.flipContainer.style.width = `${totalBookWidth}px`;
    this.flipContainer.style.height = `${pageHeight}px`;

    // Build Page elements
    this.pages.forEach((page, idx) => {
      const pageEl = document.createElement('div');
      pageEl.className = 'page';
      if (page.isCover) {
        pageEl.classList.add('--hard');
      }

      const isEven = idx % 2 === 0;
      pageEl.classList.add(isEven ? '--left' : '--right');

      pageEl.innerHTML = `
        <div class="page-header">
          <span class="chapter-label">${this.escapeHtml(page.chapterTitle)}</span>
          <span class="doc-label">Lumina</span>
        </div>
        ${page.htmlContent}
        <div class="page-footer">
          <span class="progress-label">${Math.round((page.pageNumber / this.pages.length) * 100)}%</span>
          <span class="page-number">Trang ${page.pageNumber}</span>
        </div>
        <div class="curl-hint"></div>
      `;

      this.flipContainer?.appendChild(pageEl);
    });

    try {
      this.pageFlip = new PageFlip(this.flipContainer, {
        width: pageWidth,
        height: pageHeight,
        size: 'fixed',
        minWidth: pageWidth,
        maxWidth: pageWidth,
        minHeight: pageHeight,
        maxHeight: pageHeight,
        drawShadow: true,
        flippingTime: 450,
        usePortrait: !isDual,
        startZIndex: 5,
        autoSize: false,
        maxShadowOpacity: 0.35,
        showCover: true,
        mobileScrollSupport: false,
        useMouseEvents: true,
        clickEventForward: true,
      });

      const pageElements = this.flipContainer.querySelectorAll<HTMLElement>('.page');
      this.pageFlip.loadFromHTML(pageElements);

      // Listen for page flip events
      this.pageFlip.on('flip', (e) => {
        // e.data is 0-indexed page number
        this.currentPage = (e.data ?? 0) + 1;
        this.options.onPageChange?.(this.currentPage, this.pages.length);
      });

      // Jump to initial page if > 1
      if (this.currentPage > 1) {
        this.pageFlip.turnToPage(this.currentPage - 1);
      } else {
        this.options.onPageChange?.(1, this.pages.length);
      }
    } catch (err) {
      console.warn('PageFlip canvas initialization fallback:', err);
    }
  }

  flipNext(): void {
    if (this.pageFlip) {
      this.pageFlip.flipNext('bottom');
    }
  }

  flipPrev(): void {
    if (this.pageFlip) {
      this.pageFlip.flipPrev('bottom');
    }
  }

  goToPage(pageNumber: number): void {
    const targetIdx = Math.max(0, Math.min(pageNumber - 1, this.pages.length - 1));
    if (this.pageFlip) {
      this.pageFlip.turnToPage(targetIdx);
    }
    this.currentPage = targetIdx + 1;
    this.options.onPageChange?.(this.currentPage, this.pages.length);
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  getTotalPages(): number {
    return this.pages.length;
  }

  destroy(): void {
    if (this.pageFlip) {
      try {
        this.pageFlip.destroy();
      } catch {
        // ignore cleanup error
      }
      this.pageFlip = null;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
