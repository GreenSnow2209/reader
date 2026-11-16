import JSZip from 'jszip';
import {
  ChapterData,
  DocumentEngine,
  DocumentMetadata,
  PaginationConfig,
  SearchResult,
  TocItem,
  VirtualPage,
} from '../types';
import {
  getElementText,
  parseNavDocToc,
  parseNcxToc,
  parseXml,
  resolveRelativePath,
} from './xmlUtils';
import { normalizeLegacyVietnamese } from './vietnameseDecoder';
import { PaginationEngine } from '../../pagination/PaginationEngine';

export class EpubEngine implements DocumentEngine {
  readonly format = 'epub';

  private zip: JSZip | null = null;
  private metadata: DocumentMetadata | null = null;
  private toc: TocItem[] = [];
  private chapters: ChapterData[] = [];
  private opfDir = '';

  canHandle(fileData: ArrayBuffer | Uint8Array, fileName: string): boolean {
    if (fileName.toLowerCase().endsWith('.epub')) {
      return true;
    }
    // Check ZIP magic header: PK (0x50, 0x4B, 0x03, 0x04)
    if (fileData && fileData.byteLength >= 4) {
      const bytes = new Uint8Array(fileData.slice(0, 4));
      return (
        bytes[0] === 0x50 &&
        bytes[1] === 0x4b &&
        bytes[2] === 0x03 &&
        bytes[3] === 0x04
      );
    }
    return false;
  }

  async load(data: ArrayBuffer, fileName: string): Promise<DocumentMetadata> {
    this.zip = await JSZip.loadAsync(data);

    // 1. Locate rootfile from META-INF/container.xml
    const containerFile = this.zip.file('META-INF/container.xml');
    if (!containerFile) {
      throw new Error('Invalid EPUB: Missing META-INF/container.xml');
    }

    const containerXml = await containerFile.async('text');
    const containerDoc = parseXml(containerXml);
    const rootfileEl = containerDoc.querySelector('rootfile');
    const opfPath = rootfileEl?.getAttribute('full-path');

    if (!opfPath) {
      throw new Error('Invalid EPUB: No rootfile found in container.xml');
    }

    this.opfDir = opfPath.includes('/')
      ? opfPath.substring(0, opfPath.lastIndexOf('/'))
      : '';

    // 2. Read OPF
    const opfFile = this.zip.file(opfPath);
    if (!opfFile) {
      throw new Error(`Invalid EPUB: Missing OPF file at ${opfPath}`);
    }

    const opfXml = await opfFile.async('text');
    const opfDoc = parseXml(opfXml);

    // 3. Extract Metadata
    const title = normalizeLegacyVietnamese(
      getElementText(opfDoc, 'title') || fileName.replace(/\.epub$/i, '')
    );
    const author = normalizeLegacyVietnamese(
      getElementText(opfDoc, 'creator') || 'Tác giả không xác định'
    );
    const language = getElementText(opfDoc, 'language') || 'vi';
    const publisher = getElementText(opfDoc, 'publisher') || undefined;
    const rawDesc = getElementText(opfDoc, 'description') || undefined;
    const description = rawDesc ? normalizeLegacyVietnamese(rawDesc) : undefined;

    // 4. Manifest map (id -> { href, mediaType, properties })
    const manifestItems = opfDoc.querySelectorAll('manifest item');
    const manifestMap = new Map<string, { href: string; mediaType: string; properties?: string }>();
    let coverHref: string | undefined;

    manifestItems.forEach((item) => {
      const id = item.getAttribute('id') || '';
      const href = item.getAttribute('href') || '';
      const mediaType = item.getAttribute('media-type') || '';
      const properties = item.getAttribute('properties') || '';
      manifestMap.set(id, { href, mediaType, properties });

      if (
        properties.includes('cover-image') ||
        id.toLowerCase().includes('cover') ||
        href.toLowerCase().includes('cover')
      ) {
        if (mediaType.startsWith('image/')) {
          coverHref = resolveRelativePath(this.opfDir, href);
        }
      }
    });

    // Extract Cover image as base64 data URL if found
    let coverUrl: string | undefined;
    if (coverHref) {
      const coverFile = this.zip.file(coverHref);
      if (coverFile) {
        const base64Data = await coverFile.async('base64');
        const ext = coverHref.split('.').pop()?.toLowerCase() || 'jpeg';
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        coverUrl = `data:${mime};base64,${base64Data}`;
      }
    }

    // 5. Spine items in reading order
    const spineItems = opfDoc.querySelectorAll('spine itemref');
    const spineHrefs: string[] = [];

    spineItems.forEach((itemref) => {
      const idref = itemref.getAttribute('idref') || '';
      const manifestItem = manifestMap.get(idref);
      if (manifestItem) {
        spineHrefs.push(resolveRelativePath(this.opfDir, manifestItem.href));
      }
    });

    // 6. TOC Extraction
    const spine = opfDoc.querySelector('spine');
    const tocId = spine?.getAttribute('toc');
    if (tocId && manifestMap.has(tocId)) {
      const ncxPath = resolveRelativePath(this.opfDir, manifestMap.get(tocId)!.href);
      const ncxFile = this.zip.file(ncxPath);
      if (ncxFile) {
        const ncxXml = await ncxFile.async('text');
        this.toc = parseNcxToc(ncxXml, this.opfDir);
      }
    }

    if (this.toc.length === 0) {
      // Try finding EPUB3 nav doc
      const navItem = Array.from(manifestMap.values()).find((item) =>
        item.properties?.includes('nav')
      );
      if (navItem) {
        const navPath = resolveRelativePath(this.opfDir, navItem.href);
        const navFile = this.zip.file(navPath);
        if (navFile) {
          const navXml = await navFile.async('text');
          this.toc = parseNavDocToc(navXml, this.opfDir);
        }
      }
    }

    // 7. Load Chapters content
    this.chapters = [];
    for (let i = 0; i < spineHrefs.length; i++) {
      const href = spineHrefs[i];
      const chapterFile = this.zip.file(href);
      if (!chapterFile) continue;

      const rawContent = await chapterFile.async('text');
      const normalizedContent = normalizeLegacyVietnamese(rawContent);
      const chapterDir = href.includes('/') ? href.substring(0, href.lastIndexOf('/')) : '';
      const processedHtml = await this.processChapterHtml(normalizedContent, chapterDir);

      // Create fallback title from TOC or chapter index
      const matchedToc = this.toc.find((t) => t.href.includes(href) || href.includes(t.href));
      const chapterDoc = parseXml(processedHtml);
      const headerTitle =
        chapterDoc.querySelector('h1, h2, h3, title')?.textContent?.trim() || '';
      const rawChapterTitle = matchedToc?.title || headerTitle || `Chương ${i + 1}`;
      const chapterTitle = normalizeLegacyVietnamese(rawChapterTitle);

      const chapterBody = chapterDoc.querySelector('body') || chapterDoc.documentElement;
      const plainText = chapterBody?.textContent?.replace(/\s+/g, ' ').trim() || '';

      this.chapters.push({
        id: `chap-${i + 1}`,
        title: chapterTitle,
        href,
        html: processedHtml,
        plainText,
      });
    }

    // Normalize any TOC titles that were parsed
    this.toc.forEach((item) => {
      item.title = normalizeLegacyVietnamese(item.title);
    });

    // If TOC is still empty, synthesize TOC from chapter headers
    if (this.toc.length === 0) {
      this.toc = this.chapters.map((chap, idx) => ({
        id: `toc-${idx + 1}`,
        title: chap.title,
        href: chap.href,
        level: 1,
        chapterIndex: idx,
      }));
    } else {
      // Associate chapterIndex to TOC items
      this.toc.forEach((item) => {
        const idx = this.chapters.findIndex((c) => c.href.includes(item.href) || item.href.includes(c.href));
        if (idx >= 0) item.chapterIndex = idx;
      });
    }

    const docId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.metadata = {
      id: docId,
      title,
      author,
      coverUrl,
      format: 'epub',
      language,
      publisher,
      description,
      totalChapters: this.chapters.length,
    };

    return this.metadata;
  }

  /**
   * Process chapter HTML to inline images as base64 Data URLs so they render reliably.
   */
  private async processChapterHtml(htmlString: string, chapterDir: string): Promise<string> {
    const doc = parseXml(htmlString);

    // Remove scripts and link tags
    doc.querySelectorAll('script, link[rel="stylesheet"]').forEach((el) => el.remove());

    // Inline <img> tags
    const images = doc.querySelectorAll('img, image');
    for (const img of Array.from(images)) {
      const srcAttr = img.getAttribute('src') || img.getAttribute('xlink:href');
      if (srcAttr && !srcAttr.startsWith('data:') && !srcAttr.startsWith('http')) {
        const resolvedPath = resolveRelativePath(chapterDir, srcAttr);
        const imgFile = this.zip?.file(resolvedPath);
        if (imgFile) {
          const b64 = await imgFile.async('base64');
          const ext = resolvedPath.split('.').pop()?.toLowerCase() || 'jpeg';
          const mime = ext === 'png' ? 'image/png' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
          img.setAttribute('src', `data:${mime};base64,${b64}`);
        }
      }
    }

    const bodyEl = doc.querySelector('body') || doc.documentElement;
    return bodyEl ? bodyEl.innerHTML : htmlString;
  }

  getToc(): TocItem[] {
    return this.toc;
  }

  getMetadata(): DocumentMetadata {
    if (!this.metadata) {
      throw new Error('No EPUB document currently loaded');
    }
    return this.metadata;
  }

  getChapters(): ChapterData[] {
    return this.chapters;
  }

  async paginate(config: PaginationConfig): Promise<VirtualPage[]> {
    return PaginationEngine.paginate(this.chapters, this.metadata?.coverUrl, config);
  }

  async search(query: string, pages: VirtualPage[]): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const page of pages) {
      const text = page.plainText;
      const lower = text.toLowerCase();
      let matchIdx = lower.indexOf(q);

      while (matchIdx !== -1) {
        const start = Math.max(0, matchIdx - 35);
        const end = Math.min(text.length, matchIdx + q.length + 35);
        const snippet =
          (start > 0 ? '...' : '') +
          text.substring(start, end).replace(/\s+/g, ' ') +
          (end < text.length ? '...' : '');

        results.push({
          pageNumber: page.pageNumber,
          chapterTitle: page.chapterTitle,
          snippet,
          matchIndex: matchIdx,
        });

        matchIdx = lower.indexOf(q, matchIdx + q.length);
      }
    }

    return results;
  }

  dispose(): void {
    this.zip = null;
    this.chapters = [];
    this.toc = [];
    this.metadata = null;
  }
}
