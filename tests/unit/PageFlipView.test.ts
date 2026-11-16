import { describe, it, expect } from 'vitest';
import { PageFlipView } from '../../src/ui/components/PageFlipView';
import { VirtualPage } from '../../src/core/engine/types';

describe('PageFlipView', () => {
  it('instantiates and handles empty pages gracefully', () => {
    const container = document.createElement('div');
    const view = new PageFlipView(container);
    view.setPages([]);

    expect(container.innerHTML).toContain('empty-book-placeholder');
    expect(view.getTotalPages()).toBe(0);
  });

  it('renders page wrappers and attaches page-header and footer', () => {
    const container = document.createElement('div');
    container.style.width = '1000px';
    container.style.height = '700px';

    const pages: VirtualPage[] = [
      {
        pageNumber: 1,
        chapterIndex: 0,
        chapterTitle: 'Chương 1',
        htmlContent: '<p>Trang 1</p>',
        plainText: 'Trang 1',
      },
      {
        pageNumber: 2,
        chapterIndex: 0,
        chapterTitle: 'Chương 1',
        htmlContent: '<p>Trang 2</p>',
        plainText: 'Trang 2',
      },
    ];

    let total = 0;
    const view = new PageFlipView(container, {
      onPageChange: (_p, t) => {
        total = t;
      },
    });

    view.setPages(pages, 1);
    expect(view.getTotalPages()).toBe(2);
    expect(container.querySelector('.page-header')).toBeTruthy();
    expect(container.querySelector('.page-footer')).toBeTruthy();
    expect(total).toBe(2);
  });
});
