import { describe, expect, it } from 'vitest';
import {
  isLegacyVietnamese,
  normalizeLegacyVietnamese,
} from '../../src/core/engine/epub/vietnameseDecoder';

describe('vietnameseDecoder', () => {
  describe('isLegacyVietnamese', () => {
    it('detects legacy encoded Vietnamese strings', () => {
      expect(isLegacyVietnamese('Ai lêëy miïëng pho maát cuãa töi?')).toBe(true);
      expect(isLegacyVietnamese('Lúâi giúái thiïåu cuãa Tiïën sô')).toBe(true);
      expect(isLegacyVietnamese('Spencer Johnson àûúåc bònh choån')).toBe(true);
      expect(isLegacyVietnamese('Cöng ty First News - Trñ Viïåt giûä baãn quyïìn')).toBe(true);
    });

    it('returns false for standard modern Vietnamese', () => {
      expect(
        isLegacyVietnamese(
          'Khi tôi lên sáu tuổi, một lần nọ tôi nhìn thấy một bức tranh tuyệt đẹp trong một cuốn sách về Rừng Nguyên Sinh.'
        )
      ).toBe(false);
      expect(isLegacyVietnamese('Hoàng Tử Bé')).toBe(false);
      expect(isLegacyVietnamese('Ai lấy miếng pho mát của tôi?')).toBe(false);
    });

    it('returns false for English and empty text', () => {
      expect(isLegacyVietnamese('')).toBe(false);
      expect(isLegacyVietnamese('The quick brown fox jumps over the lazy dog.')).toBe(false);
      expect(isLegacyVietnamese('Chapter 1: The Beginning')).toBe(false);
    });
  });

  describe('normalizeLegacyVietnamese', () => {
    it('decodes title and subtitle correctly', () => {
      const input = 'Ai lêëy miïëng pho maát cuãa töi?   5';
      const expected = 'Ai lấy miếng pho mát của tôi?   5';
      expect(normalizeLegacyVietnamese(input)).toBe(expected);
    });

    it('decodes intro headers and honorary titles', () => {
      const input = 'Lúâi giúái thiïåu cuãa Tiïën sô';
      const expected = 'Lời giới thiệu của Tiến sĩ';
      expect(normalizeLegacyVietnamese(input)).toBe(expected);
    });

    it('decodes copyright notices and publisher lines', () => {
      const input =
        'Cöng ty First News - Trñ Viïåt giûä baãn quyïìn xuêët baãn vaâ phaát haânh';
      const expected =
        'Công ty First News - Trí Việt giữ bản quyền xuất bản và phát hành';
      expect(normalizeLegacyVietnamese(input)).toBe(expected);
    });

    it('decodes complex body sentences with composite tone marks', () => {
      const input =
        'Töi vêîn coân nhúá nhû in caãm giaác cuãa mònh khi lêìn àêìu tiïn nghe Spencer Johnson kïí cêu chuyïån vïì nhûäng miïëng pho maát cuãa öng.';
      const expected =
        'Tôi vẫn còn nhớ như in cảm giác của mình khi lần đầu tiên nghe Spencer Johnson kể câu chuyện về những miếng pho mát của ông.';
      expect(normalizeLegacyVietnamese(input)).toBe(expected);
    });

    it('decodes difficult words like được, hưởng, bằng phẳng, chẳng, và nghĩ', () => {
      const input =
        'Spencer Johnson àûúåc bònh choån laâ möåt trong nhûäng cêy buát coá aãnh hûúãng lúán nhêët. Cuöåc söëng vöën khöng bùçng phùèng... anh chùèng hïì thñch thuá gò vaâ suy nghô rêët àún giaãn.';
      const expected =
        'Spencer Johnson được bình chọn là một trong những cây bút có ảnh hưởng lớn nhất. Cuộc sống vốn không bằng phẳng... anh chẳng hề thích thú gì và suy nghĩ rất đơn giản.';
      expect(normalizeLegacyVietnamese(input)).toBe(expected);
    });

    it('preserves HTML structure while decoding text inside tags', () => {
      const htmlInput =
        '<p class="calibre1"><b class="calibre4">Lúâi giúái thiïåu cuãa Tiïën sô</b></p><p class="calibre1">Ai lêëy miïëng pho maát cuãa töi?</p>';
      const htmlExpected =
        '<p class="calibre1"><b class="calibre4">Lời giới thiệu của Tiến sĩ</b></p><p class="calibre1">Ai lấy miếng pho mát của tôi?</p>';
      expect(normalizeLegacyVietnamese(htmlInput)).toBe(htmlExpected);
    });

    it('returns modern text untouched', () => {
      const modernText =
        'Hoàng Tử Bé là một câu chuyện kinh điển của Antoine de Saint-Exupéry.';
      expect(normalizeLegacyVietnamese(modernText)).toBe(modernText);
    });
  });
});
