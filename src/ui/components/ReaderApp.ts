import { StoredBook, StorageManager } from '../../core/storage/StorageManager';
import { DocumentEngine, VirtualPage } from '../../core/engine/types';
import { DocumentRegistry } from '../../core/engine/DocumentRegistry';
import { ThemeManager } from '../../core/theme/ThemeManager';
import { PageFlipView } from './PageFlipView';
import { SidebarDrawer } from './SidebarDrawer';
import { ShortcutManager } from '../../core/input/ShortcutManager';

export interface ReaderAppOptions {
  onBackToShelf: () => void;
}

export class ReaderApp {
  private container: HTMLElement;
  private options: ReaderAppOptions;
  private themeManager: ThemeManager;
  private currentBook: StoredBook | null = null;
  private currentEngine: DocumentEngine | null = null;
  private pages: VirtualPage[] = [];
  private pageFlipView: PageFlipView | null = null;
  private sidebarDrawer: SidebarDrawer | null = null;
  private shortcutManager: ShortcutManager | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private isToolbarVisible = true;
  private hideToolbarTimer: number | null = null;

  constructor(
    container: HTMLElement,
    themeManager: ThemeManager,
    options: ReaderAppOptions
  ) {
    this.container = container;
    this.themeManager = themeManager;
    this.options = options;
  }

  async openBook(book: StoredBook): Promise<void> {
    this.currentBook = book;
    this.currentEngine = DocumentRegistry.getEngineForFile(book.data, `${book.title}.${book.format}`);
    await this.currentEngine.load(book.data, `${book.title}.${book.format}`);

    this.renderSkeleton();
    await this.paginateAndRender();
    this.setupShortcuts();
    this.setupResizeObserver();
  }

  private renderSkeleton(): void {
    if (!this.currentBook) return;

    this.container.innerHTML = `
      <div class="reader-container">
        <!-- Floating Top Toolbar -->
        <header class="reader-toolbar-top" id="reader-toolbar-top">
          <div class="reader-nav-left">
            <button class="btn-icon" id="btn-back-shelf" title="Quay lại Kệ Sách">
              <span>←</span>
            </button>
            <div class="reader-book-title" title="${this.currentBook.title}">
              ${this.currentBook.title}
            </div>
          </div>
          <div class="reader-nav-right">
            <button class="btn-icon" id="btn-toggle-spread" title="Chế độ trang">📄</button>
            <button class="btn-icon" id="btn-open-toc" title="Mục lục">📑</button>
            <button class="btn-icon" id="btn-toggle-bm" title="Đánh dấu trang này">🔖</button>
            <button class="btn-icon" id="btn-open-search" title="Tìm kiếm">🔍</button>
            <button class="btn-icon" id="btn-open-settings" title="Cài đặt giao diện">⚙️</button>
            <button class="btn-icon" id="btn-toggle-fullscreen" title="Toàn màn hình">⛶</button>
          </div>
        </header>

        <!-- Center Viewport for 3D Book Flip -->
        <main class="reader-viewport" id="reader-page-viewport"></main>

        <!-- Flip Side Overlay Arrows (Desktop) -->
        <button class="flip-side-btn --prev" id="btn-side-prev" title="Trang trước (← hoặc ↑)">‹</button>
        <button class="flip-side-btn --next" id="btn-side-next" title="Trang sau (→ hoặc ↓)">›</button>

        <!-- Floating Bottom Toolbar -->
        <footer class="reader-toolbar-bottom" id="reader-toolbar-bottom">
          <button class="btn-icon" id="btn-bar-prev" title="Trang trước">‹</button>
          <div class="slider-container">
            <input type="range" class="page-slider" id="reader-page-slider" min="1" max="1" value="1" />
            <span class="page-indicator" id="reader-page-indicator">Trang 1 / 1</span>
          </div>
          <button class="btn-icon" id="btn-bar-next" title="Trang sau">›</button>
        </footer>

        <!-- Sidebar Drawer Container -->
        <div id="drawer-mount-point"></div>
      </div>
    `;

    // Hook buttons
    this.container.querySelector('#btn-back-shelf')?.addEventListener('click', () => {
      this.destroy();
      this.options.onBackToShelf();
    });

    this.container.querySelector('#btn-toggle-spread')?.addEventListener('click', () => {
      const current = this.themeManager.getSettings().isDualPage;
      this.themeManager.setDualPage(!current);
      this.paginateAndRender(false);
    });

    this.container.querySelector('#btn-open-toc')?.addEventListener('click', () => {
      this.sidebarDrawer?.toggle('toc');
    });

    this.container.querySelector('#btn-toggle-bm')?.addEventListener('click', async () => {
      await this.handleToggleBookmark();
    });

    this.container.querySelector('#btn-open-search')?.addEventListener('click', () => {
      this.sidebarDrawer?.toggle('search');
    });

    this.container.querySelector('#btn-open-settings')?.addEventListener('click', () => {
      this.sidebarDrawer?.toggle('settings');
    });

    this.container.querySelector('#btn-toggle-fullscreen')?.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    this.container.querySelector('#btn-side-prev')?.addEventListener('click', () => {
      this.pageFlipView?.flipPrev();
    });

    this.container.querySelector('#btn-side-next')?.addEventListener('click', () => {
      this.pageFlipView?.flipNext();
    });

    this.container.querySelector('#btn-bar-prev')?.addEventListener('click', () => {
      this.pageFlipView?.flipPrev();
    });

    this.container.querySelector('#btn-bar-next')?.addEventListener('click', () => {
      this.pageFlipView?.flipNext();
    });

    // Page slider scrubbing
    const slider = this.container.querySelector<HTMLInputElement>('#reader-page-slider');
    slider?.addEventListener('input', () => {
      const page = parseInt(slider.value, 10);
      this.pageFlipView?.goToPage(page);
    });

    // Mount Drawer
    const drawerMount = this.container.querySelector<HTMLElement>('#drawer-mount-point')!;
    this.sidebarDrawer = new SidebarDrawer(drawerMount, this.themeManager, {
      onJumpToPage: (page) => this.pageFlipView?.goToPage(page),
      onThemeChanged: () => this.paginateAndRender(false),
      onSearch: async (q) => {
        if (!this.currentEngine) return [];
        return this.currentEngine.search(q, this.pages);
      },
    });

    if (this.currentBook && this.currentEngine) {
      this.sidebarDrawer.setBookData(this.currentBook.id, this.currentEngine.getToc());
    }

    // Auto-hide toolbar on inactive mouse
    const readerContainer = this.container.querySelector('.reader-container');
    readerContainer?.addEventListener('mousemove', () => this.showToolbarTemporarily());
  }

  private async paginateAndRender(restoreProgress = true): Promise<void> {
    if (!this.currentBook || !this.currentEngine) return;

    const viewportEl = this.container.querySelector<HTMLElement>('#reader-page-viewport');
    if (!viewportEl) return;

    const rect = viewportEl.getBoundingClientRect();
    const settings = this.themeManager.getSettings();

    const width = rect.width > 0 ? rect.width : window.innerWidth;
    const height = rect.height > 0 ? rect.height : window.innerHeight - 80;

    // Dual page mode requires wide window (>= 1020px) AND landscape aspect ratio AND user setting
    const isDual = width >= 1020 && width >= height * 1.15 && settings.isDualPage;

    // Update spread button icon
    const spreadBtn = this.container.querySelector('#btn-toggle-spread');
    if (spreadBtn) {
      spreadBtn.textContent = isDual ? '📖' : '📄';
      spreadBtn.setAttribute(
        'title',
        isDual
          ? 'Đang ở chế độ 2 trang (Bấm để chuyển về 1 trang)'
          : 'Đang ở chế độ 1 trang (Bấm để chuyển sang 2 trang)'
      );
    }

    const pageWidth = isDual
      ? Math.min(620, Math.max(340, Math.floor((width * 0.94) / 2)))
      : Math.min(740, Math.max(340, Math.floor(width * 0.90)));
    const pageHeight = Math.max(400, Math.floor(height * 0.94));

    const paginationConfig = {
      viewportWidth: pageWidth,
      viewportHeight: pageHeight,
      fontSize: settings.fontSize,
      lineHeight: settings.lineHeight,
      margin: settings.margin,
      fontFamily: settings.fontFamily === 'serif' ? 'Merriweather, serif' : 'Inter, sans-serif',
      isDualPage: false, // Each page is pre-sized to individual page dimensions
    };

    let targetPage = 1;

    if (restoreProgress) {
      const saved = await StorageManager.getProgress(this.currentBook.id);
      if (saved && saved.pageNumber > 0) {
        targetPage = saved.pageNumber;
      }
    } else if (this.pageFlipView) {
      // Keep approximate reading % during resize or font change
      const current = this.pageFlipView.getCurrentPage();
      const total = this.pageFlipView.getTotalPages();
      const ratio = total > 0 ? current / total : 0;
      targetPage = Math.max(1, Math.round(ratio * (this.pages.length || 1)));
    }

    this.pages = await this.currentEngine.paginate(paginationConfig);

    // Reinitialize PageFlipView with the updated isDual setting
    if (this.pageFlipView) {
      this.pageFlipView.destroy();
      this.pageFlipView = null;
    }

    this.pageFlipView = new PageFlipView(viewportEl, {
      isDualPage: isDual,
      onPageChange: (p, t) => this.handlePageChanged(p, t),
    });

    this.pageFlipView.setPages(this.pages, targetPage);
    this.updateSliderAndIndicators(targetPage, this.pages.length);
  }

  private handlePageChanged(currentPage: number, totalPages: number): void {
    this.updateSliderAndIndicators(currentPage, totalPages);

    if (this.currentBook && totalPages > 0) {
      const percent = Math.round((currentPage / totalPages) * 100);
      const curPageObj = this.pages[currentPage - 1];

      StorageManager.saveProgress({
        bookId: this.currentBook.id,
        pageNumber: currentPage,
        chapterIndex: curPageObj ? curPageObj.chapterIndex : 0,
        totalPages,
        progressPercent: percent,
        updatedAt: Date.now(),
      }).catch((e) => console.warn('Progress save failed:', e));
    }
  }

  private updateSliderAndIndicators(page: number, total: number): void {
    const slider = this.container.querySelector<HTMLInputElement>('#reader-page-slider');
    const indicator = this.container.querySelector('#reader-page-indicator');

    if (slider) {
      slider.max = `${Math.max(1, total)}`;
      slider.value = `${page}`;
    }

    if (indicator) {
      const percent = total > 0 ? Math.round((page / total) * 100) : 0;
      indicator.textContent = `Trang ${page} / ${total} (${percent}%)`;
    }
  }

  private async handleToggleBookmark(): Promise<void> {
    if (!this.currentBook || !this.pageFlipView) return;
    const curPageNum = this.pageFlipView.getCurrentPage();
    const curPage = this.pages[curPageNum - 1];
    if (!curPage) return;

    const bookmark = {
      id: `bm-${Date.now()}`,
      bookId: this.currentBook.id,
      pageNumber: curPageNum,
      chapterTitle: curPage.chapterTitle,
      excerpt: curPage.plainText.substring(0, 100) + '...',
      createdAt: Date.now(),
    };

    await StorageManager.addBookmark(bookmark);
    await this.sidebarDrawer?.loadBookmarks();
    alert(`Đã đánh dấu Trang ${curPageNum}!`);
  }

  private setupShortcuts(): void {
    this.shortcutManager = new ShortcutManager({
      onNextPage: () => this.pageFlipView?.flipNext(),
      onPrevPage: () => this.pageFlipView?.flipPrev(),
      onToggleMenu: () => this.toggleToolbar(),
      onToggleFullscreen: () => this.toggleFullscreen(),
      onCloseOverlay: () => this.sidebarDrawer?.close(),
    });
  }

  private setupResizeObserver(): void {
    const viewportEl = this.container.querySelector<HTMLElement>('#reader-page-viewport');
    if (!viewportEl) return;

    let resizeTimer: number;
    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        this.paginateAndRender(false);
      }, 250);
    });

    this.resizeObserver.observe(viewportEl);
  }

  private toggleToolbar(): void {
    this.isToolbarVisible = !this.isToolbarVisible;
    const top = this.container.querySelector('#reader-toolbar-top');
    const bottom = this.container.querySelector('#reader-toolbar-bottom');

    top?.classList.toggle('--hidden', !this.isToolbarVisible);
    bottom?.classList.toggle('--hidden', !this.isToolbarVisible);
  }

  private showToolbarTemporarily(): void {
    if (!this.isToolbarVisible) {
      this.isToolbarVisible = true;
      this.container.querySelector('#reader-toolbar-top')?.classList.remove('--hidden');
      this.container.querySelector('#reader-toolbar-bottom')?.classList.remove('--hidden');
    }

    if (this.hideToolbarTimer) {
      window.clearTimeout(this.hideToolbarTimer);
    }

    this.hideToolbarTimer = window.setTimeout(() => {
      // Only auto-hide if drawer is not open
      const drawerOpen = this.container.querySelector('.sidebar-drawer.--open');
      if (!drawerOpen) {
        this.container.querySelector('#reader-toolbar-top')?.classList.add('--hidden');
        this.container.querySelector('#reader-toolbar-bottom')?.classList.add('--hidden');
        this.isToolbarVisible = false;
      }
    }, 4000);
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.shortcutManager?.destroy();
    this.pageFlipView?.destroy();
    if (this.hideToolbarTimer) window.clearTimeout(this.hideToolbarTimer);
    this.currentEngine?.dispose();
  }
}
