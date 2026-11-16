export interface DocumentMetadata {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  format: 'epub' | 'pdf' | 'docx' | 'txt';
  totalChapters?: number;
  language?: string;
  description?: string;
  publisher?: string;
}

export interface TocItem {
  id: string;
  title: string;
  href: string;
  level: number;
  chapterIndex?: number;
  subitems?: TocItem[];
}

export interface VirtualPage {
  pageNumber: number; // 1-indexed relative to whole document
  chapterIndex: number;
  chapterTitle: string;
  htmlContent: string;
  plainText: string;
  isCover?: boolean;
}

export interface PaginationConfig {
  viewportWidth: number;
  viewportHeight: number;
  fontSize: number; // in px
  lineHeight: number; // multiplier e.g. 1.6
  margin: number; // in px
  fontFamily: string;
  isDualPage: boolean;
}

export interface SearchResult {
  pageNumber: number;
  chapterTitle: string;
  snippet: string;
  matchIndex: number;
}

export interface ChapterData {
  id: string;
  title: string;
  href: string;
  html: string;
  plainText: string;
}

export interface DocumentEngine {
  readonly format: string;
  canHandle(fileData: ArrayBuffer | Uint8Array, fileName: string): boolean;
  load(data: ArrayBuffer, fileName: string): Promise<DocumentMetadata>;
  getToc(): TocItem[];
  getMetadata(): DocumentMetadata;
  getChapters(): ChapterData[];
  paginate(config: PaginationConfig): Promise<VirtualPage[]>;
  search(query: string, pages: VirtualPage[]): Promise<SearchResult[]>;
  dispose(): void;
}
