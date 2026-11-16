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
 * Modular Word (DOCX) Reader Engine Stub.
 * When activated, this module uses mammoth.js to convert docx XML to semantic HTML
 * and feeds into Lumina Reader's virtual pagination and 3D page-flip engine seamlessly.
 */
export class DocxEngineStub implements DocumentEngine {
  readonly format = 'docx';

  private metadata: DocumentMetadata | null = null;
  private chapters: ChapterData[] = [];

  canHandle(_fileData: ArrayBuffer | Uint8Array, fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc');
  }

  async load(_data: ArrayBuffer, fileName: string): Promise<DocumentMetadata> {
    const title = fileName.replace(/\.docx?$/i, '');
    this.metadata = {
      id: `docx-${Date.now()}`,
      title,
      author: 'Tài liệu Word',
      format: 'docx',
      totalChapters: 1,
    };
    return this.metadata;
  }

  getToc(): TocItem[] {
    return [{ id: 'docx-toc-1', title: this.metadata?.title || 'Tài liệu Word', href: '#section-1', level: 1, chapterIndex: 0 }];
  }

  getMetadata(): DocumentMetadata {
    if (!this.metadata) throw new Error('No DOCX document loaded');
    return this.metadata;
  }

  getChapters(): ChapterData[] {
    return this.chapters;
  }

  async paginate(_config: PaginationConfig): Promise<VirtualPage[]> {
    return [];
  }

  async search(_query: string, _pages: VirtualPage[]): Promise<SearchResult[]> {
    return [];
  }

  dispose(): void {
    this.metadata = null;
    this.chapters = [];
  }
}
