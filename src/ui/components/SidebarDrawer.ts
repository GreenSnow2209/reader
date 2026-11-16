import { TocItem, SearchResult } from '../../core/engine/types';
import { ThemeManager, ThemeName } from '../../core/theme/ThemeManager';
import { Bookmark, StorageManager } from '../../core/storage/StorageManager';

export interface SidebarDrawerOptions {
  onJumpToPage: (pageNumber: number) => void;
  onThemeChanged: () => void;
  onSearch: (query: string) => Promise<SearchResult[]>;
}

export class SidebarDrawer {
  private container: HTMLElement;
  private options: SidebarDrawerOptions;
  private themeManager: ThemeManager;
  private isOpen = false;
  private activeTab: 'toc' | 'bookmarks' | 'search' | 'settings' = 'toc';
  private tocItems: TocItem[] = [];
  private bookmarks: Bookmark[] = [];
  private searchResults: SearchResult[] = [];
  private currentQuery = '';
  private currentBookId = '';

  constructor(
    container: HTMLElement,
    themeManager: ThemeManager,
    options: SidebarDrawerOptions
  ) {
    this.container = container;
    this.themeManager = themeManager;
    this.options = options;
  }

  setBookData(bookId: string, toc: TocItem[]): void {
    this.currentBookId = bookId;
    this.tocItems = toc;
    this.loadBookmarks();
  }

  async loadBookmarks(): Promise<void> {
    if (!this.currentBookId) return;
    try {
      this.bookmarks = await StorageManager.getBookmarks(this.currentBookId);
      if (this.isOpen && this.activeTab === 'bookmarks') {
        this.renderContent();
      }
    } catch (e) {
      console.warn('Could not load bookmarks:', e);
    }
  }

  open(tab: 'toc' | 'bookmarks' | 'search' | 'settings' = 'toc'): void {
    this.activeTab = tab;
    this.isOpen = true;
    this.render();
  }

  close(): void {
    this.isOpen = false;
    const drawerEl = this.container.querySelector('.sidebar-drawer');
    const backdropEl = this.container.querySelector('.drawer-backdrop');
    drawerEl?.classList.remove('--open');
    backdropEl?.classList.remove('--open');
  }

  toggle(tab?: 'toc' | 'bookmarks' | 'search' | 'settings'): void {
    if (this.isOpen && (!tab || this.activeTab === tab)) {
      this.close();
    } else {
      this.open(tab || this.activeTab);
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="drawer-backdrop ${this.isOpen ? '--open' : ''}"></div>
      <div class="sidebar-drawer ${this.isOpen ? '--open' : ''}">
        <div class="drawer-header">
          <strong style="font-family: var(--font-display); font-size: 16px;">Menu Sách</strong>
          <button class="btn-icon btn-close-drawer" title="Đóng menu">✕</button>
        </div>
        <div class="drawer-tabs">
          <button class="drawer-tab ${this.activeTab === 'toc' ? '--active' : ''}" data-tab="toc">Mục lục</button>
          <button class="drawer-tab ${this.activeTab === 'bookmarks' ? '--active' : ''}" data-tab="bookmarks">Đánh dấu</button>
          <button class="drawer-tab ${this.activeTab === 'search' ? '--active' : ''}" data-tab="search">Tìm kiếm</button>
          <button class="drawer-tab ${this.activeTab === 'settings' ? '--active' : ''}" data-tab="settings">Cài đặt</button>
        </div>
        <div class="drawer-content" id="drawer-tab-content"></div>
      </div>
    `;

    // Event listeners
    this.container.querySelector('.drawer-backdrop')?.addEventListener('click', () => this.close());
    this.container.querySelector('.btn-close-drawer')?.addEventListener('click', () => this.close());

    this.container.querySelectorAll<HTMLButtonElement>('.drawer-tab').forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        const tab = tabBtn.dataset.tab as typeof this.activeTab;
        this.activeTab = tab;
        this.container.querySelectorAll('.drawer-tab').forEach((b) => b.classList.remove('--active'));
        tabBtn.classList.add('--active');
        this.renderContent();
      });
    });

    this.renderContent();
  }

  private renderContent(): void {
    const contentEl = this.container.querySelector('#drawer-tab-content');
    if (!contentEl) return;

    switch (this.activeTab) {
      case 'toc':
        this.renderToc(contentEl);
        break;
      case 'bookmarks':
        this.renderBookmarks(contentEl);
        break;
      case 'search':
        this.renderSearch(contentEl);
        break;
      case 'settings':
        this.renderSettings(contentEl);
        break;
    }
  }

  private renderToc(container: Element): void {
    if (this.tocItems.length === 0) {
      container.innerHTML = '<p style="opacity: 0.6; text-align: center;">Chưa có mục lục.</p>';
      return;
    }

    const html = `
      <ul class="toc-list">
        ${this.tocItems
          .map(
            (item, idx) => `
          <li class="toc-item ${item.level > 1 ? '--level-2' : ''}" data-chap="${item.chapterIndex ?? idx}">
            <span style="flex: 1;">${item.title}</span>
            <span style="opacity: 0.5; font-size: 11px;">Chương ${(item.chapterIndex ?? idx) + 1}</span>
          </li>
        `
          )
          .join('')}
      </ul>
    `;
    container.innerHTML = html;

    container.querySelectorAll('.toc-item').forEach((itemEl) => {
      itemEl.addEventListener('click', () => {
        const chapIdx = parseInt(itemEl.getAttribute('data-chap') || '0', 10);
        // Dispatch jump request
        this.options.onJumpToPage(chapIdx + 1);
        this.close();
      });
    });
  }

  private renderBookmarks(container: Element): void {
    if (this.bookmarks.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px 0; opacity: 0.65;">
          <p>Chưa có trang nào được đánh dấu.</p>
          <p style="font-size: 12px;">Nhấn vào biểu tượng Bookmark trên thanh điều hướng để lưu lại trang hiện tại.</p>
        </div>
      `;
      return;
    }

    const html = `
      <div class="bookmarks-list">
        ${this.bookmarks
          .map(
            (bm) => `
          <div class="search-result-card" data-page="${bm.pageNumber}">
            <div class="search-result-header">
              <span>Trang ${bm.pageNumber} • ${bm.chapterTitle}</span>
              <button class="btn-delete-bm" data-id="${bm.id}" style="background: none; border: none; cursor: pointer; color: #E53E3E;">✕</button>
            </div>
            <div class="search-result-snippet">${bm.excerpt || 'Không có đoạn trích'}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
    container.innerHTML = html;

    container.querySelectorAll('.search-result-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).classList.contains('btn-delete-bm')) return;
        const page = parseInt(card.getAttribute('data-page') || '1', 10);
        this.options.onJumpToPage(page);
        this.close();
      });
    });

    container.querySelectorAll('.btn-delete-bm').forEach((delBtn) => {
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = delBtn.getAttribute('data-id');
        if (id) {
          await StorageManager.removeBookmark(id);
          await this.loadBookmarks();
        }
      });
    });
  }

  private renderSearch(container: Element): void {
    container.innerHTML = `
      <div class="search-box">
        <input type="text" class="search-input" placeholder="Nhập từ khóa tìm kiếm..." value="${this.currentQuery}" />
        <button class="btn-primary btn-do-search" style="padding: 0 14px;">Tìm</button>
      </div>
      <div class="search-results-container">
        ${
          this.searchResults.length > 0
            ? this.searchResults
                .map(
                  (res) => `
              <div class="search-result-card" data-page="${res.pageNumber}">
                <div class="search-result-header">
                  <span>Trang ${res.pageNumber} • ${res.chapterTitle}</span>
                </div>
                <div class="search-result-snippet">${this.highlightMatch(res.snippet, this.currentQuery)}</div>
              </div>
            `
                )
                .join('')
            : this.currentQuery
            ? '<p style="text-align: center; opacity: 0.6;">Không tìm thấy kết quả phù hợp.</p>'
            : '<p style="text-align: center; opacity: 0.6;">Tìm kiếm câu, từ hoặc đoạn văn trong sách.</p>'
        }
      </div>
    `;

    const input = container.querySelector<HTMLInputElement>('.search-input');
    const searchBtn = container.querySelector('.btn-do-search');

    const executeSearch = async () => {
      const q = input?.value.trim() || '';
      this.currentQuery = q;
      if (q) {
        this.searchResults = await this.options.onSearch(q);
      } else {
        this.searchResults = [];
      }
      this.renderSearch(container);
    };

    searchBtn?.addEventListener('click', executeSearch);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeSearch();
    });

    container.querySelectorAll('.search-result-card').forEach((card) => {
      card.addEventListener('click', () => {
        const page = parseInt(card.getAttribute('data-page') || '1', 10);
        this.options.onJumpToPage(page);
        this.close();
      });
    });
  }

  private highlightMatch(text: string, query: string): string {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private renderSettings(container: Element): void {
    const s = this.themeManager.getSettings();

    container.innerHTML = `
      <div class="settings-group">
        <label class="settings-label">Giao diện đọc (Bảo vệ mắt)</label>
        <div class="theme-options">
          <button class="theme-btn --sepia ${s.theme === 'sepia' ? '--active' : ''}" data-theme="sepia">
            <span>📜</span>
            <span>Sepia Giấy</span>
          </button>
          <button class="theme-btn --dark ${s.theme === 'dark' ? '--active' : ''}" data-theme="dark">
            <span>🌙</span>
            <span>Nền tối</span>
          </button>
          <button class="theme-btn --light ${s.theme === 'light' ? '--active' : ''}" data-theme="light">
            <span>☀️</span>
            <span>Nền sáng</span>
          </button>
        </div>
      </div>

      <div class="settings-group">
        <label class="settings-label">Cỡ chữ: <span id="font-size-val">${s.fontSize}px</span></label>
        <div class="range-control">
          <span>A-</span>
          <input type="range" id="input-font-size" min="12" max="28" value="${s.fontSize}" />
          <span>A+</span>
        </div>
      </div>

      <div class="settings-group">
        <label class="settings-label">Khoảng cách dòng: <span id="line-height-val">${s.lineHeight}</span></label>
        <div class="range-control">
          <input type="range" id="input-line-height" min="1.3" max="2.2" step="0.1" value="${s.lineHeight}" />
        </div>
      </div>

      <div class="settings-group">
        <label class="settings-label">Kiểu chữ</label>
        <div style="display: flex; gap: 10px;">
          <button class="btn-primary" id="btn-font-serif" style="flex: 1; ${s.fontFamily === 'serif' ? '' : 'opacity: 0.6;'}">Có chân (Serif)</button>
          <button class="btn-primary" id="btn-font-sans" style="flex: 1; ${s.fontFamily === 'sans' ? '' : 'opacity: 0.6;'}">Không chân (Sans)</button>
        </div>
      </div>

      <div class="settings-group">
        <label class="settings-label">Chế độ lật trang</label>
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" id="check-dual-page" ${s.isDualPage ? 'checked' : ''} />
          <span>2 trang mở song song trên màn hình rộng</span>
        </label>
      </div>

      <div class="settings-group">
        <label class="settings-label">Phím âm lượng (Mobile)</label>
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" id="check-volume-keys" ${s.volumeKeysEnabled ? 'checked' : ''} />
          <span>Dùng nút Volume Up/Down để chuyển trang</span>
        </label>
      </div>
    `;

    // Theme buttons
    container.querySelectorAll<HTMLButtonElement>('.theme-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme as ThemeName;
        this.themeManager.setTheme(theme);
        this.renderSettings(container);
        this.options.onThemeChanged();
      });
    });

    // Font size slider
    const fontSlider = container.querySelector<HTMLInputElement>('#input-font-size');
    fontSlider?.addEventListener('input', () => {
      const val = parseInt(fontSlider.value, 10);
      container.querySelector('#font-size-val')!.textContent = `${val}px`;
      this.themeManager.setFontSize(val);
      this.options.onThemeChanged();
    });

    // Line height slider
    const lineSlider = container.querySelector<HTMLInputElement>('#input-line-height');
    lineSlider?.addEventListener('input', () => {
      const val = parseFloat(lineSlider.value);
      container.querySelector('#line-height-val')!.textContent = `${val}`;
      this.themeManager.setLineHeight(val);
      this.options.onThemeChanged();
    });

    // Font family buttons
    container.querySelector('#btn-font-serif')?.addEventListener('click', () => {
      this.themeManager.setFontFamily('serif');
      this.renderSettings(container);
      this.options.onThemeChanged();
    });
    container.querySelector('#btn-font-sans')?.addEventListener('click', () => {
      this.themeManager.setFontFamily('sans');
      this.renderSettings(container);
      this.options.onThemeChanged();
    });

    // Dual page checkbox
    container.querySelector<HTMLInputElement>('#check-dual-page')?.addEventListener('change', (e) => {
      const isDual = (e.target as HTMLInputElement).checked;
      this.themeManager.setDualPage(isDual);
      this.options.onThemeChanged();
    });

    // Volume keys checkbox
    container.querySelector<HTMLInputElement>('#check-volume-keys')?.addEventListener('change', (e) => {
      const vol = (e.target as HTMLInputElement).checked;
      this.themeManager.updateSettings({ volumeKeysEnabled: vol });
    });
  }
}
