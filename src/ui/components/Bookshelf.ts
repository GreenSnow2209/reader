import { StoredBook, StorageManager } from '../../core/storage/StorageManager';
import { DocumentRegistry } from '../../core/engine/DocumentRegistry';
import { createSampleEpub } from '../../assets/sample-book';

export interface BookshelfOptions {
  onSelectBook: (book: StoredBook) => void;
}

export class Bookshelf {
  private container: HTMLElement;
  private options: BookshelfOptions;
  private books: StoredBook[] = [];
  private progressMap = new Map<string, number>();

  constructor(container: HTMLElement, options: BookshelfOptions) {
    this.container = container;
    this.options = options;
  }

  async init(): Promise<void> {
    await this.loadBooks();
    this.render();
  }

  async loadBooks(): Promise<void> {
    try {
      this.books = await StorageManager.getAllBooks();

      // If library is empty on first launch, load the sample classic book!
      if (this.books.length === 0) {
        const sampleBuffer = await createSampleEpub();
        const epubEngine = DocumentRegistry.getEngineForFile(sampleBuffer, 'hoang-tu-be.epub');
        const meta = await epubEngine.load(sampleBuffer, 'Hoàng Tử Bé (Le Petit Prince)');

        const sampleBook: StoredBook = {
          ...meta,
          data: sampleBuffer,
          addedAt: Date.now(),
        };

        await StorageManager.saveBook(sampleBook);
        this.books = [sampleBook];
      }

      // Load progress percentages
      for (const b of this.books) {
        const prog = await StorageManager.getProgress(b.id);
        if (prog) {
          this.progressMap.set(b.id, prog.progressPercent || 0);
        } else {
          this.progressMap.set(b.id, 0);
        }
      }
    } catch (err) {
      console.warn('Error loading bookshelf:', err);
    }
  }

  render(): void {
    this.container.innerHTML = `
      <div class="bookshelf-container">
        <header class="bookshelf-header">
          <div class="brand-title">
            <span style="font-size: 32px;">📖</span>
            <div>
              <h1>Lumina Reader</h1>
              <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
                <span class="brand-badge">Cross-Platform</span>
                <span style="font-size: 12px; opacity: 0.65;">Thư viện sách cá nhân</span>
              </div>
            </div>
          </div>
          <div class="bookshelf-actions">
            <input type="file" id="file-import-input" accept=".epub,.pdf,.docx" style="display: none;" />
            <button class="btn-primary" id="btn-import-book">
              <span>+</span>
              <span>Thêm sách</span>
            </button>
          </div>
        </header>

        <main class="books-grid">
          ${this.books
            .map((book) => {
              const progress = this.progressMap.get(book.id) || 0;
              return `
              <div class="book-card" data-book-id="${book.id}">
                <button class="btn-card-delete" data-book-id="${book.id}" title="Xóa sách">✕</button>
                <div class="book-card-cover">
                  ${
                    book.coverUrl
                      ? `<img src="${book.coverUrl}" alt="${this.escapeHtml(book.title)}" />`
                      : `
                      <div class="cover-fallback">
                        <div class="cover-fallback-title">${this.escapeHtml(book.title)}</div>
                        <div class="cover-fallback-author">${this.escapeHtml(book.author)}</div>
                      </div>
                    `
                  }
                </div>
                <div class="book-card-info">
                  <div class="book-card-title">${this.escapeHtml(book.title)}</div>
                  <div class="book-card-author">${this.escapeHtml(book.author)}</div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width: ${progress}%;"></div>
                  </div>
                  <div class="progress-text">
                    <span>Định dạng: ${book.format.toUpperCase()}</span>
                    <span>${progress}% đã đọc</span>
                  </div>
                </div>
              </div>
            `;
            })
            .join('')}
        </main>
      </div>
    `;

    // Hook Import Button
    const fileInput = this.container.querySelector<HTMLInputElement>('#file-import-input');
    const importBtn = this.container.querySelector('#btn-import-book');

    importBtn?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (file) {
        await this.handleImportFile(file);
        fileInput.value = '';
      }
    });

    // Drag and Drop files onto bookshelf
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    this.container.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        await this.handleImportFile(file);
      }
    });

    // Book card click
    this.container.querySelectorAll('.book-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.btn-card-delete')) return;
        const id = card.getAttribute('data-book-id');
        const book = this.books.find((b) => b.id === id);
        if (book) {
          this.options.onSelectBook(book);
        }
      });
    });

    // Delete book click
    this.container.querySelectorAll('.btn-card-delete').forEach((delBtn) => {
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = delBtn.getAttribute('data-book-id');
        if (id && confirm('Bạn có chắc chắn muốn xóa cuốn sách này khỏi thư viện?')) {
          await StorageManager.deleteBook(id);
          await this.loadBooks();
          this.render();
        }
      });
    });
  }

  private async handleImportFile(file: File): Promise<void> {
    try {
      const buffer = await file.arrayBuffer();
      const engine = DocumentRegistry.getEngineForFile(buffer, file.name);
      const meta = await engine.load(buffer, file.name);

      const storedBook: StoredBook = {
        ...meta,
        data: buffer,
        addedAt: Date.now(),
      };

      await StorageManager.saveBook(storedBook);
      await this.loadBooks();
      this.render();
    } catch (err: unknown) {
      alert(`Không thể đọc tệp sách: ${(err as Error).message}`);
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
