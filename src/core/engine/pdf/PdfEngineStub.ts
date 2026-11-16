import {
  ChapterData,
  DocumentEngine,
  DocumentMetadata,
  PaginationConfig,
  SearchResult,
  TocItem,
  VirtualPage,
} from '../types';

/**
 * Modular PDF Reader Engine Stub.
 * When activated, this module uses pdfjs-dist to parse pages into canvas/SVG
 * and feeds into Lumina Reader's 3D page-flip engine seamlessly.
 */
export class PdfEngineStub implements DocumentEngine {
  readonly format = 'pdf';

  private metadata: DocumentMetadata | null = null;
  private pages: ChapterData[] = [];

  canHandle(fileData: ArrayBuffer | Uint8Array, fileName: string): boolean {
    if (fileName.toLowerCase().endsWith('.pdf')) return true;
    if (fileData && fileData.byteLength >= 4) {
      const bytes = new Uint8Array(fileData.slice(0, 4));
      // %PDF (0x25, 0x50, 0x44, 0x46)
      return (
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46
      );
    }
    return false;
  }

  async load(_data: ArrayBuffer, fileName: string): Promise<DocumentMetadata> {
    const title = fileName.replace(/\.pdf$/i, '');
    this.metadata = {
      id: `pdf-${Date.now()}`,
      title,
      author: 'Tài liệu PDF',
      format: 'pdf',
      totalChapters: 1,
    };
    return this.metadata;
  }

  getToc(): TocItem[] {
    return [{ id: 'pdf-toc-1', title: this.metadata?.title || 'Tài liệu PDF', href: '#page-1', level: 1, chapterIndex: 0 }];
  }

  getMetadata(): DocumentMetadata {
    if (!this.metadata) throw new Error('No PDF document loaded');
    return this.metadata;
  }

  getChapters(): ChapterData[] {
    return this.pages;
  }

  async paginate(_config: PaginationConfig): Promise<VirtualPage[]> {
    return [];
  }

  async search(_query: string, _pages: VirtualPage[]): Promise<SearchResult[]> {
    return [];
  }

  dispose(): void {
    this.metadata = null;
    this.pages = [];
  }
}
