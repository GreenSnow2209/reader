import { TocItem } from '../types';

/**
 * Utility functions for XML DOM parsing of EPUB container, OPF, and NCX documents.
 */

export function parseXml(xmlString: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    // Fallback to text/html if XML has non-strict errors
    return parser.parseFromString(xmlString, 'text/html');
  }
  return doc;
}

export function getElementText(parent: Element | Document, tagName: string): string {
  // Handles namespaced tags like dc:title, dc:creator
  const el =
    parent.getElementsByTagName(tagName)[0] ||
    Array.from(parent.querySelectorAll('*')).find(
      (node) => node.localName === tagName || node.tagName.endsWith(':' + tagName)
    );
  return el?.textContent?.trim() || '';
}

export function resolveRelativePath(baseDir: string, relativePath: string): string {
  // Clean baseDir and relativePath
  const stack = baseDir ? baseDir.split('/').filter(Boolean) : [];
  const parts = relativePath.split('/');

  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(part);
    }
  }

  return stack.join('/');
}

export function parseNcxToc(ncxXml: string, opfDir: string): TocItem[] {
  const doc = parseXml(ncxXml);
  const navMap = doc.querySelector('navMap');
  if (!navMap) return [];

  function parseNavPoints(parent: Element, level: number): TocItem[] {
    const navPoints = Array.from(parent.children).filter(
      (c) => c.localName === 'navPoint'
    );
    return navPoints.map((np, idx) => {
      const labelEl = np.querySelector('navLabel text');
      const contentEl = np.querySelector('content');
      const title = labelEl?.textContent?.trim() || `Chapter ${idx + 1}`;
      const src = contentEl?.getAttribute('src') || '';
      const href = resolveRelativePath(opfDir, src);

      const subitems = parseNavPoints(np, level + 1);

      return {
        id: np.getAttribute('id') || `nav-${level}-${idx}`,
        title,
        href,
        level,
        subitems: subitems.length > 0 ? subitems : undefined,
      };
    });
  }

  return parseNavPoints(navMap, 1);
}

export function parseNavDocToc(navDocXml: string, opfDir: string): TocItem[] {
  const doc = parseXml(navDocXml);
  const navEl = doc.querySelector('nav[*|type="toc"], nav#toc, nav');
  if (!navEl) return [];

  const items: TocItem[] = [];

  function parseOl(ol: Element, level: number): TocItem[] {
    const lis = Array.from(ol.children).filter((c) => c.localName === 'li');
    return lis.map((li, idx) => {
      const a = li.querySelector('a');
      const title = a?.textContent?.trim() || `Section ${idx + 1}`;
      const hrefAttr = a?.getAttribute('href') || '';
      const href = resolveRelativePath(opfDir, hrefAttr);
      const subOl = li.querySelector('ol');
      const subitems = subOl ? parseOl(subOl, level + 1) : undefined;

      return {
        id: `nav-${level}-${idx}`,
        title,
        href,
        level,
        subitems,
      };
    });
  }

  const rootOl = navEl.querySelector('ol');
  return rootOl ? parseOl(rootOl, 1) : items;
}
