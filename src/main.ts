import './ui/styles/main.css';
import { DocumentRegistry } from './core/engine/DocumentRegistry';
import { EpubEngine } from './core/engine/epub/EpubEngine';
import { PdfEngineStub } from './core/engine/pdf/PdfEngineStub';
import { DocxEngineStub } from './core/engine/docx/DocxEngineStub';
import { ThemeManager } from './core/theme/ThemeManager';
import { Bookshelf } from './ui/components/Bookshelf';
import { ReaderApp } from './ui/components/ReaderApp';
import { StoredBook } from './core/storage/StorageManager';

// 1. Register Document Engines (EPUB first, modular stubs for PDF and DOCX)
DocumentRegistry.register(new EpubEngine());
DocumentRegistry.register(new PdfEngineStub());
DocumentRegistry.register(new DocxEngineStub());

// 2. Initialize Theme & Eye-Care System
const themeManager = new ThemeManager();

// 3. Application State & Root
const appElement = document.getElementById('app');
if (!appElement) {
  throw new Error('Root #app container not found in DOM');
}

let bookshelf: Bookshelf | null = null;
let readerApp: ReaderApp | null = null;

function showBookshelf() {
  if (readerApp) {
    readerApp.destroy();
    readerApp = null;
  }

  bookshelf = new Bookshelf(appElement!, {
    onSelectBook: (book: StoredBook) => {
      showReader(book);
    },
  });
  bookshelf.init();
}

function showReader(book: StoredBook) {
  bookshelf = null;
  readerApp = new ReaderApp(appElement!, themeManager, {
    onBackToShelf: () => {
      showBookshelf();
    },
  });
  readerApp.openBook(book);
}

// Bootstrap
showBookshelf();
