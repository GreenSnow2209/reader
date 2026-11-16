import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentRegistry } from '../../src/core/engine/DocumentRegistry';
import { DocumentEngine, DocumentMetadata, PaginationConfig, TocItem, VirtualPage, SearchResult, ChapterData } from '../../src/core/engine/types';

class MockEpubEngine implements DocumentEngine {
  readonly format = 'epub';
  canHandle(_data: ArrayBuffer | Uint8Array, fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.epub');
  }
  async load(_data: ArrayBuffer, _fileName: string): Promise<DocumentMetadata> {
    return { id: 'mock-1', title: 'Mock Book', author: 'Author', format: 'epub' };
  }
  getToc(): TocItem[] { return []; }
  getMetadata(): DocumentMetadata { return { id: 'mock-1', title: 'Mock Book', author: 'Author', format: 'epub' }; }
  getChapters(): ChapterData[] { return []; }
  async paginate(_config: PaginationConfig): Promise<VirtualPage[]> { return []; }
  async search(_query: string, _pages: VirtualPage[]): Promise<SearchResult[]> { return []; }
  dispose(): void {}
}

class MockPdfEngine implements DocumentEngine {
  readonly format = 'pdf';
  canHandle(_data: ArrayBuffer | Uint8Array, fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.pdf');
  }
  async load(_data: ArrayBuffer, _fileName: string): Promise<DocumentMetadata> {
    return { id: 'mock-pdf', title: 'Mock PDF', author: 'Author', format: 'pdf' };
  }
  getToc(): TocItem[] { return []; }
  getMetadata(): DocumentMetadata { return { id: 'mock-pdf', title: 'Mock PDF', author: 'Author', format: 'pdf' }; }
  getChapters(): ChapterData[] { return []; }
  async paginate(_config: PaginationConfig): Promise<VirtualPage[]> { return []; }
  async search(_query: string, _pages: VirtualPage[]): Promise<SearchResult[]> { return []; }
  dispose(): void {}
}

describe('DocumentRegistry', () => {
  beforeEach(() => {
    DocumentRegistry.clear();
  });

  it('registers and lists supported formats', () => {
    DocumentRegistry.register(new MockEpubEngine());
    DocumentRegistry.register(new MockPdfEngine());

    expect(DocumentRegistry.getSupportedFormats()).toEqual(['epub', 'pdf']);
  });

  it('retrieves the matching engine for a file extension', () => {
    DocumentRegistry.register(new MockEpubEngine());
    DocumentRegistry.register(new MockPdfEngine());

    const engine = DocumentRegistry.getEngineForFile(new Uint8Array(0), 'novel.epub');
    expect(engine.format).toBe('epub');

    const pdfEngine = DocumentRegistry.getEngineForFile(new Uint8Array(0), 'document.pdf');
    expect(pdfEngine.format).toBe('pdf');
  });

  it('throws an informative error for unregistered formats', () => {
    DocumentRegistry.register(new MockEpubEngine());

    expect(() => {
      DocumentRegistry.getEngineForFile(new Uint8Array(0), 'notes.docx');
    }).toThrowError(/Unsupported document format: "\.docx"/);
  });
});
