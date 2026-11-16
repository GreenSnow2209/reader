import { describe, it, expect } from 'vitest';
import { PaginationEngine } from '../../src/core/pagination/PaginationEngine';
import { ChapterData, PaginationConfig } from '../../src/core/engine/types';

describe('PaginationEngine', () => {
  const config: PaginationConfig = {
    viewportWidth: 1000,
    viewportHeight: 700,
    fontSize: 16,
    lineHeight: 1.6,
    margin: 32,
    fontFamily: 'Lora, serif',
    isDualPage: true,
  };

  it('paginates a short chapter into at least 1 page', () => {
    const chapters: ChapterData[] = [
      {
        id: 'c1',
        title: 'Chương 1: Mở đầu',
        href: 'chap1.xhtml',
        html: '<h1>Chương 1</h1><p>Đây là câu chuyện về một người du hành thời gian.</p>',
        plainText: 'Chương 1 Đây là câu chuyện về một người du hành thời gian.',
      },
    ];

    const pages = PaginationEngine.paginate(chapters, undefined, config);
    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(pages[0].chapterTitle).toBe('Chương 1: Mở đầu');
    expect(pages[0].htmlContent).toContain('Đây là câu chuyện');
  });

  it('adds a cover page when coverUrl is provided', () => {
    const chapters: ChapterData[] = [
      {
        id: 'c1',
        title: 'Chương 1',
        href: 'c1.xhtml',
        html: '<p>Nội dung ngắn.</p>',
        plainText: 'Nội dung ngắn.',
      },
    ];

    const pages = PaginationEngine.paginate(chapters, 'data:image/jpeg;base64,mock', config);
    expect(pages[0].isCover).toBe(true);
    expect(pages[0].chapterTitle).toBe('Bìa sách');
    expect(pages[0].htmlContent).toContain('cover-image');
  });

  it('splits a massive chapter into multiple virtual pages', () => {
    const paragraphs: string[] = [];
    for (let i = 0; i < 40; i++) {
      paragraphs.push(
        `<p>Đoạn văn thứ ${i + 1}: Cuộc phiêu lưu tiếp tục qua những vùng đất mới lạ, nơi mà bầu trời có màu tím biếc và những con sông chảy ngược dòng lên đỉnh núi cao vời vợi.</p>`
      );
    }

    const chapters: ChapterData[] = [
      {
        id: 'c2',
        title: 'Chương dài',
        href: 'long.xhtml',
        html: `<h1>Chương Dài</h1>${paragraphs.join('')}`,
        plainText: paragraphs.join(' ').replace(/<[^>]+>/g, ''),
      },
    ];

    const pages = PaginationEngine.paginate(chapters, undefined, config);
    expect(pages.length).toBeGreaterThan(2);
    // Page numbers must be sequential
    pages.forEach((p, idx) => {
      expect(p.pageNumber).toBe(idx + 1);
    });
  });
});
