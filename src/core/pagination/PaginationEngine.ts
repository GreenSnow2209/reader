import { ChapterData, PaginationConfig, VirtualPage } from '../engine/types';
import { DomMeasurer } from './domMeasurer';

export class PaginationEngine {
  /**
   * Paginates a list of chapters into an array of discrete VirtualPage objects.
   */
  static paginate(
    chapters: ChapterData[],
    coverUrl: string | undefined,
    config: PaginationConfig
  ): VirtualPage[] {
    const pages: VirtualPage[] = [];
    const { width: innerWidth, height: innerHeight } = DomMeasurer.getPageInnerDimensions(config);

    let globalPageNumber = 1;

    // 1. Cover Page (if coverUrl exists)
    if (coverUrl) {
      pages.push({
        pageNumber: globalPageNumber++,
        chapterIndex: -1,
        chapterTitle: 'Bìa sách',
        htmlContent: `
          <div class="book-cover-page">
            <img src="${coverUrl}" alt="Bìa sách" class="cover-image" />
          </div>
        `,
        plainText: 'Bìa sách',
        isCover: true,
      });
    }

    // 2. Iterate each chapter and paginate its blocks
    for (let cIndex = 0; cIndex < chapters.length; cIndex++) {
      const chapter = chapters[cIndex];
      const chapterPages = this.paginateChapter(chapter, cIndex, innerWidth, innerHeight, config);

      for (const cp of chapterPages) {
        cp.pageNumber = globalPageNumber++;
        pages.push(cp);
      }
    }

    // Ensure even number of pages for dual-page book view so last spread closes gracefully
    if (config.isDualPage && pages.length % 2 !== 0) {
      pages.push({
        pageNumber: globalPageNumber,
        chapterIndex: chapters.length - 1,
        chapterTitle: 'Trang kết',
        htmlContent: '<div class="blank-page-note"><em>~ Hết ~</em></div>',
        plainText: '',
      });
    }

    return pages;
  }

  private static paginateChapter(
    chapter: ChapterData,
    chapterIndex: number,
    innerWidth: number,
    innerHeight: number,
    config: PaginationConfig
  ): VirtualPage[] {
    const pages: VirtualPage[] = [];

    // Parse chapter HTML into block elements
    const parser = new DOMParser();
    const doc = parser.parseFromString(chapter.html, 'text/html');
    const bodyChildren = Array.from(doc.body.children);

    // If body has no direct children, wrap text in paragraphs
    const blocks: HTMLElement[] = [];
    if (bodyChildren.length === 0) {
      const p = document.createElement('p');
      p.innerHTML = chapter.html || chapter.plainText;
      blocks.push(p);
    } else {
      bodyChildren.forEach((child) => blocks.push(child as HTMLElement));
    }

    let currentPageBlocks: string[] = [];
    let currentPagePlain: string[] = [];
    let currentHeight = 0;

    for (const block of blocks) {
      const blockHtml = block.outerHTML;
      const blockText = block.textContent?.trim() || '';
      if (!blockText && !block.querySelector('img')) continue;

      const blockHeight = DomMeasurer.measureBlock(blockHtml, blockText, config, innerWidth);

      // Case A: Block fits into current page
      if (currentHeight + blockHeight <= innerHeight) {
        currentPageBlocks.push(blockHtml);
        currentPagePlain.push(blockText);
        currentHeight += blockHeight;
      }
      // Case B: Block does not fit in remaining space, but fits in an empty page
      else if (blockHeight <= innerHeight) {
        if (currentPageBlocks.length > 0) {
          pages.push(this.createPage(chapterIndex, chapter.title, currentPageBlocks, currentPagePlain));
          currentPageBlocks = [];
          currentPagePlain = [];
          currentHeight = 0;
        }
        currentPageBlocks.push(blockHtml);
        currentPagePlain.push(blockText);
        currentHeight = blockHeight;
      }
      // Case C: Giant block (e.g. huge paragraph) that exceeds entire innerHeight
      else {
        // First flush current page if it has content
        if (currentPageBlocks.length > 0) {
          pages.push(this.createPage(chapterIndex, chapter.title, currentPageBlocks, currentPagePlain));
          currentPageBlocks = [];
          currentPagePlain = [];
          currentHeight = 0;
        }

        // Split the large block text into smaller sub-paragraphs
        const subParagraphs = this.splitLargeText(blockText, innerWidth, innerHeight, config);
        for (const subText of subParagraphs) {
          const subHtml = `<p class="split-paragraph">${subText}</p>`;
          const subHeight = DomMeasurer.measureBlock(subHtml, subText, config, innerWidth);

          if (currentHeight + subHeight > innerHeight && currentPageBlocks.length > 0) {
            pages.push(this.createPage(chapterIndex, chapter.title, currentPageBlocks, currentPagePlain));
            currentPageBlocks = [];
            currentPagePlain = [];
            currentHeight = 0;
          }

          currentPageBlocks.push(subHtml);
          currentPagePlain.push(subText);
          currentHeight += subHeight;
        }
      }
    }

    // Flush any remaining content as the final page of this chapter
    if (currentPageBlocks.length > 0) {
      pages.push(this.createPage(chapterIndex, chapter.title, currentPageBlocks, currentPagePlain));
    }

    return pages;
  }

  private static splitLargeText(
    text: string,
    innerWidth: number,
    innerHeight: number,
    config: PaginationConfig
  ): string[] {
    const avgCharWidth = config.fontSize * 0.52;
    const charsPerLine = Math.max(20, Math.floor(innerWidth / avgCharWidth));
    const linesPerPage = Math.max(4, Math.floor(innerHeight / (config.fontSize * config.lineHeight))) - 2;
    const maxCharsPerPage = Math.floor(charsPerLine * linesPerPage);

    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentLen = 0;

    for (const word of words) {
      if (currentLen + word.length + 1 > maxCharsPerPage && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [word];
        currentLen = word.length;
      } else {
        currentChunk.push(word);
        currentLen += word.length + 1;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  private static createPage(
    chapterIndex: number,
    chapterTitle: string,
    blocks: string[],
    plainTexts: string[]
  ): VirtualPage {
    return {
      pageNumber: 0, // Assigned by caller
      chapterIndex,
      chapterTitle,
      htmlContent: `<div class="virtual-page-body">${blocks.join('\n')}</div>`,
      plainText: plainTexts.join(' '),
    };
  }
}
