# Architectural Design: Cross-Platform Modular Book Reader (EPUB, PDF, DOCX)

**Date**: 2026-11-16  
**Status**: Approved  
**Targets**: Linux, Windows, Android  

---

## 1. Executive Summary

This document specifies the architecture and technical design of **Lumina Reader**, a modern, lightweight, cross-platform e-reader application built for Linux, Windows, and Android.

### Key Objectives
1. **Modular Engine Architecture**: First-class support for EPUB documents, designed with a decoupled `DocumentEngine` interface so future formats (PDF, DOCX, Markdown, CBZ) can be plugged in without touching the reader UI or animation system.
2. **Realistic 3D Book Page Flip**: Photorealistic page curl and flip animations supporting corner dragging, click/key flipping, soft/hard covers, page shadows, and paper curvature physics.
3. **Adaptive Responsive Layout & Dynamic Reflow**: Automatically scales and paginates text to fit window dimensions. Displays an open two-page book spread on wide screens (Desktop/Tablet landscape) and an elegant single page on narrow screens (Mobile portrait), with user overrides.
4. **Desktop & Mobile Controls**:
   - Desktop: Left/Right and Up/Down arrow keys, PageUp/PageDown, Space.
   - Mobile: Touch swipe gestures, tap navigation zones, Volume Up/Down key flipping.
5. **Eye-Care Themes & Typography**: Warm sepia (antique paper), OLED dark mode, and soft light mode, with real-time font size, line height, margins, and typeface adjustments.
6. **Core Reader Tooling**: Local bookshelf library, Table of Contents (TOC) drawer, bookmarks, reading progress tracking (chapter + percentage), full-text search, and highlights.
7. **Cross-Platform Delivery**: Vite + TypeScript + Electron for Linux/Windows native desktop apps, Capacitor + PWA for Android, offline-first with IndexedDB persistence.

---

## 2. System Architecture

```
+-------------------------------------------------------------------------+
|                              Lumina Reader                              |
+-------------------------------------------------------------------------+
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                        User Interface (UI)                        |  |
|  |  [ Bookshelf ] [ Reader Header ] [ Page Flip Viewport ] [ TOC ]   |  |
|  |  [ Eye-Care Settings ] [ Search Bar ] [ Bookmarks & Highlights ]   |  |
|  +-------------------------------------------------------------------+  |
|                                     |                                   |
|  +----------------------------------v--------------------------------+  |
|  |                    Interaction & Input Layer                      |  |
|  |  - Desktop Shortcuts (Arrows, Up/Down, Space, PageUp/Down)       |  |
|  |  - Mobile Touch Gestures (Swipe, Peeling Corner Drag)             |  |
|  |  - Android Hardware Volume Keys (Volume Up/Down to Flip)          |  |
|  +-------------------------------------------------------------------+  |
|                                     |                                   |
|  +----------------------------------v--------------------------------+  |
|  |                 Virtual Pagination & Flip Engine                  |  |
|  |  - StPageFlip 3D Engine (Curl, Shadow, Dual-Page / Single-Page)   |  |
|  |  - Text & Block Measurer (Window Resize Reflow, Content Splitting)|  |
|  +-------------------------------------------------------------------+  |
|                                     |                                   |
|  +----------------------------------v--------------------------------+  |
|  |                   Document Engine Registry                        |  |
|  |  +-------------------------------------------------------------+  |  |
|  |  |             <<Interface>> DocumentEngine                    |  |  |
|  |  +-------------------------------------------------------------+  |  |
|  |         |                        |                       |        |  |
|  |  +------v-------+         +------v-------+        +------v------+ |  |
|  |  |  EpubEngine  |         |  (PdfEngine) |        | (DocxEngine)| |  |
|  |  +--------------+         +--------------+        +-------------+ |  |
|  +-------------------------------------------------------------------+  |
|                                     |                                   |
|  +----------------------------------v--------------------------------+  |
|  |                      Storage & Cache Layer                        |  |
|  |  - IndexedDB (Library files, Reading Progress, Bookmarks, Notes)  |  |
|  |  - LocalStorage (Theme & Reader Preferences)                      |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 3. Modular Document Engine

To satisfy the requirement that EPUB is implemented first while enabling future modules (PDF, Word, etc.) to be plugged in effortlessly, Lumina Reader adopts an **Abstract Factory & Plugin Pattern**.

### 3.1 DocumentEngine Interface
```typescript
export interface DocumentMetadata {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  format: 'epub' | 'pdf' | 'docx' | 'txt';
  totalChapters?: number;
}

export interface TocItem {
  id: string;
  title: string;
  href: string;
  level: number;
  subitems?: TocItem[];
}

export interface VirtualPage {
  pageNumber: number;
  chapterIndex: number;
  chapterTitle: string;
  htmlContent: string;
  plainText: string;
}

export interface PaginationConfig {
  viewportWidth: number;
  viewportHeight: number;
  fontSize: number;
  lineHeight: number;
  margin: number;
  fontFamily: string;
  isDualPage: boolean;
}

export interface DocumentEngine {
  readonly format: string;
  canHandle(file: File | Blob | ArrayBuffer, fileName: string): boolean;
  load(data: ArrayBuffer, fileName: string): Promise<DocumentMetadata>;
  getToc(): TocItem[];
  getMetadata(): DocumentMetadata;
  paginate(config: PaginationConfig): Promise<VirtualPage[]>;
  search(query: string): Promise<SearchResult[]>;
  dispose(): void;
}
```

### 3.2 Document Engine Registry
A central registry handles format auto-detection and instantiates the correct engine:
```typescript
class DocumentRegistry {
  private static engines: DocumentEngine[] = [];

  static register(engine: DocumentEngine): void {
    this.engines.push(engine);
  }

  static getEngineForFile(data: ArrayBuffer, fileName: string): DocumentEngine {
    const matched = this.engines.find(e => e.canHandle(data, fileName));
    if (!matched) throw new Error(`No engine available for format: ${fileName}`);
    return matched;
  }
}
```
*Adding PDF or DOCX later simply requires calling `DocumentRegistry.register(new PdfEngine())` or `DocumentRegistry.register(new DocxEngine())`.*

---

## 4. Virtual Pagination & Text Scaling Strategy

EPUB files consist of reflowable XHTML chapters. Because screen dimensions, window sizes, font sizes, and line heights vary dynamically:
1. **Viewport Box Measurement**:
   - Content area inner width = `(viewportWidth / (isDualPage ? 2 : 1)) - (margin * 2)`
   - Content area inner height = `viewportHeight - headerHeight - footerHeight - (margin * 2)`
2. **DOM Block Breakdown**:
   - Each XHTML chapter is parsed into a DOM tree.
   - Text and structural elements (`<p>`, `<h1>`..`<h6>`, `<img>`, `<blockquote>`) are traversed sequentially.
3. **Dynamic Pagination Algorithm**:
   - A hidden, off-screen measurement container renders blocks with the active typography (font, size, line-height).
   - When cumulative element height exceeds the page inner height, a page boundary is created.
   - Paragraphs that exceed the remaining page height are split at sentence/word boundaries so no vertical scrollbar is ever required; text flows naturally into the next page.
4. **Window Resize & Orientation Change**:
   - A debounced `ResizeObserver` monitors the window / container dimensions.
   - When the user resizes the window, current reading location is converted into relative progress (`currentGlobalOffset / totalWords`).
   - The engine repaginates and smoothly repositions the reader to the exact corresponding virtual page.

---

## 5. 3D Page Flip & Gesture Controller

1. **Page-Curl Engine**:
   - Powered by StPageFlip physics with 3D WebGL / CSS3 3D perspective transforms.
   - Realistic lighting gradients simulate the shadow under curling paper and the highlight on the paper fold.
   - Peeling corner effect: hovering or dragging any corner bends the page naturally with mouse / touch tracking.
2. **Layout Adaptation**:
   - `windowWidth >= 900px`: Automatic **Two-Page Spread** (left & right open book).
   - `windowWidth < 900px` (or mobile portrait): Automatic **Single-Page Spread**.
   - User toggle in Settings allows forcing single-page mode on wide monitors.
3. **Controls & Navigation**:
   - **Desktop Keyboards**:
     - `ArrowRight`, `ArrowDown`, `PageDown`, `Space`: Next Page.
     - `ArrowLeft`, `ArrowUp`, `PageUp`, `Shift+Space`: Previous Page.
     - `F11`: Toggle Fullscreen.
     - `Esc`: Close drawers / full-screen.
   - **Mobile Touch Gestures**:
     - Swipe Left / Swipe Right across page.
     - Tap right 20% of screen: Next page; Tap left 20%: Previous page; Tap center 60%: Toggle toolbar.
   - **Mobile Hardware Volume Keys**:
     - Android platform channel / keydown hook captures `VolumeDown` (Next page) and `VolumeUp` (Previous page) while reading.

---

## 6. Eye-Care Themes & Customization

Lumina Reader provides three meticulously calibrated eye-care themes:
1. **Sepia (Warm Antique Paper)**:
   - Background: `#FBF0D9`
   - Page Surface: `#F6E8C3`
   - Text Color: `#5F4B32`
   - Accents / Spine: `#D8C3A5`
2. **Dark Mode (Night Owl / OLED)**:
   - Background: `#121212`
   - Page Surface: `#1E1E1E`
   - Text Color: `#DCDCDC`
   - Accents: `#3A3A3C`
3. **Soft Light (Morning Reading)**:
   - Background: `#F5F6F8`
   - Page Surface: `#FFFFFF`
   - Text Color: `#2C3E50`
   - Accents: `#E2E8F0`

**Typography Adjustments**:
- Font Sizes: 12px to 28px (default 16px).
- Line Heights: 1.2 to 2.2 (default 1.6).
- Margins: 16px to 64px.
- Font Family: System Serif (Merriweather/Georgia), Modern Sans-Serif (Inter/Roboto), OpenDyslexic.

---

## 7. Storage & Data Persistence

1. **Library & File Cache**:
   - EPUB files imported via Drag & Drop or File Picker are stored in browser/Electron `IndexedDB` (`lumina_books` store).
   - Preloaded with a sample classic public-domain EPUB book so users can read immediately upon launching.
2. **Reading Progress**:
   - Book ID, current chapter, virtual page index, and completion percentage (%) stored in `lumina_progress`.
   - Re-opening any book immediately jumps to the exact last read page.
3. **Bookmarks & Highlights**:
   - Stored in `lumina_annotations` with text excerpts, page number, timestamp, and optional user notes.
4. **User Preferences**:
   - Persisted in `localStorage` (theme, font size, line spacing, layout mode).

---

## 8. Cross-Platform Build & Delivery

1. **Linux & Windows Desktop**:
   - Electron wrapper with native window frame, frameless title bar options, and native file associations.
   - Packaged with electron-builder for AppImage/deb (Linux) and portable/NSIS exe (Windows).
2. **Android**:
   - Capacitor configuration with Android WebView, hardware key listener for volume buttons, full-screen immersive mode.
   - Standard PWA manifest + ServiceWorker enabling installation on Android via Chrome/Edge.

---

## 9. Verification & Acceptance Criteria

| Requirement | Test & Acceptance Criteria |
|-------------|----------------------------|
| EPUB Engine | Loads valid .epub files, unpacks XML/CSS, extracts chapters, images, and TOC. |
| Extensibility | `DocumentEngine` interface in place; registry enables future PDF/Word plugins. |
| Page Flip Animation | StPageFlip renders realistic 3D curl, corner peeling, and shadow. |
| Responsive Reflow | Resizing window dynamically recalculates pages and maintains reading %. |
| Desktop Shortcuts | Arrow Left/Right, Up/Down, PageUp/Down turn pages reliably. |
| Mobile Navigation | Swipe gestures, tap zones, and volume keys trigger page turn. |
| Themes & Eye-Care | Sepia, Dark, Light themes switch instantly with font/spacing sliders. |
| Library & Persistence | Bookshelf persists imported books and reading progress across restarts. |
