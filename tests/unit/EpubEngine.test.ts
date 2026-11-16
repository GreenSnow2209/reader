import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { EpubEngine } from '../../src/core/engine/epub/EpubEngine';

describe('EpubEngine', () => {
  it('correctly detects .epub extension and magic bytes', () => {
    const engine = new EpubEngine();
    expect(engine.canHandle(new Uint8Array(0), 'sample.epub')).toBe(true);
    expect(engine.canHandle(new Uint8Array(0), 'sample.pdf')).toBe(false);

    // ZIP magic bytes PK\x03\x04
    const zipMagic = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00]);
    expect(engine.canHandle(zipMagic, 'unknown_file')).toBe(true);
  });

  it('unpacks an EPUB container and reads metadata, TOC and chapters', async () => {
    const zip = new JSZip();

    // 1. mimetype
    zip.file('mimetype', 'application/epub+zip');

    // 2. container.xml
    zip.file(
      'META-INF/container.xml',
      `<?xml version="1.0"?>
      <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
        <rootfiles>
          <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`
    );

    // 3. content.opf
    zip.file(
      'OEBPS/content.opf',
      `<?xml version="1.0" encoding="utf-8"?>
      <package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
        <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
          <dc:title>Cuộc Phiêu Lưu Kỷ Niệm</dc:title>
          <dc:creator>Nguyễn Nhật Ánh</dc:creator>
          <dc:language>vi</dc:language>
        </metadata>
        <manifest>
          <item id="chap1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
          <item id="chap2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
          <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        </manifest>
        <spine toc="ncx">
          <itemref idref="chap1"/>
          <itemref idref="chap2"/>
        </spine>
      </package>`
    );

    // 4. toc.ncx
    zip.file(
      'OEBPS/toc.ncx',
      `<?xml version="1.0" encoding="UTF-8"?>
      <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
        <navMap>
          <navPoint id="np1">
            <navLabel><text>Chương 1: Ngày Đầu Tiên</text></navLabel>
            <content src="chapter1.xhtml"/>
          </navPoint>
          <navPoint id="np2">
            <navLabel><text>Chương 2: Cánh Diều Tuổi Thơ</text></navLabel>
            <content src="chapter2.xhtml"/>
          </navPoint>
        </navMap>
      </ncx>`
    );

    // 5. Chapters
    zip.file(
      'OEBPS/chapter1.xhtml',
      `<!DOCTYPE html><html><body><h1>Ngày Đầu Tiên</h1><p>Mùa hạ năm ấy tiếng ve ngân vang ran rác ngoài đầu ngõ.</p></body></html>`
    );
    zip.file(
      'OEBPS/chapter2.xhtml',
      `<!DOCTYPE html><html><body><h1>Cánh Diều Tuổi Thơ</h1><p>Gió lộng chiều tà nâng cánh diều lên cao vút tầng mây.</p></body></html>`
    );

    const epubArrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    const engine = new EpubEngine();
    const meta = await engine.load(epubArrayBuffer, 'adventure.epub');

    expect(meta.title).toBe('Cuộc Phiêu Lưu Kỷ Niệm');
    expect(meta.author).toBe('Nguyễn Nhật Ánh');
    expect(meta.totalChapters).toBe(2);

    const toc = engine.getToc();
    expect(toc.length).toBe(2);
    expect(toc[0].title).toBe('Chương 1: Ngày Đầu Tiên');

    const chapters = engine.getChapters();
    expect(chapters.length).toBe(2);
    expect(chapters[0].html).toContain('Mùa hạ năm ấy');

    // Test search
    const pages = await engine.paginate({
      viewportWidth: 800,
      viewportHeight: 600,
      fontSize: 16,
      lineHeight: 1.6,
      margin: 20,
      fontFamily: 'serif',
      isDualPage: false,
    });
    const searchResults = await engine.search('cánh diều', pages);
    expect(searchResults.length).toBe(2);
    expect(searchResults[0].chapterTitle).toContain('Cánh Diều Tuổi Thơ');
  });

  it('automatically detects and normalizes legacy composite Vietnamese EPUBs', async () => {
    const zip = new JSZip();
    zip.file('mimetype', 'application/epub+zip');
    zip.file(
      'META-INF/container.xml',
      `<?xml version="1.0"?>
      <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
        <rootfiles>
          <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>`
    );
    zip.file(
      'content.opf',
      `<?xml version="1.0" encoding="utf-8"?>
      <package xmlns="http://www.idpf.org/2007/opf" version="2.0">
        <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
          <dc:title>Ai lêëy miïëng pho maát cuãa töi?</dc:title>
          <dc:creator>Spencer Johnson</dc:creator>
        </metadata>
        <manifest>
          <item id="c1" href="chap1.html" media-type="text/html"/>
        </manifest>
        <spine>
          <itemref idref="c1"/>
        </spine>
      </package>`
    );
    zip.file(
      'chap1.html',
      `<html><body><h1>Lúâi giúái thiïåu cuãa Tiïën sô</h1><p>Spencer Johnson àûúåc bònh choån laâ möåt trong nhûäng cêy buát coá aãnh hûúãng lúán nhêët.</p></body></html>`
    );

    const data = await zip.generateAsync({ type: 'arraybuffer' });
    const engine = new EpubEngine();
    const meta = await engine.load(data, 'legacy.epub');

    expect(meta.title).toBe('Ai lấy miếng pho mát của tôi?');
    const chaps = engine.getChapters();
    expect(chaps[0].title).toBe('Lời giới thiệu của Tiến sĩ');
    expect(chaps[0].html).toContain('Spencer Johnson được bình chọn là một trong những cây bút có ảnh hưởng lớn nhất.');
    expect(chaps[0].plainText).toContain('Lời giới thiệu của Tiến sĩ');
  });
});
