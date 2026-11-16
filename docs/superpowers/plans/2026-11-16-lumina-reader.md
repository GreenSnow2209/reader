# Lumina Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Lumina Reader, a cross-platform modular e-reader application (Linux, Windows, Android) featuring realistic 3D book page flip animations, dynamic text scaling/reflow on window resize, desktop arrow & mobile swipe/volume key controls, eye-care themes (Sepia, Dark, Light), and an extensible document engine architecture (EPUB first, ready for PDF/Word).

**Architecture:** A lightweight, decoupled TypeScript client built with Vite. It features a strict `DocumentEngine` plugin interface for multi-format extensibility, a virtual pagination engine using DOM measurement for fluid reflow on resize, and StPageFlip for realistic 3D paper curling and dual/single-page spread layout. Local storage and books are stored offline via IndexedDB. Packaged for Linux/Windows via Electron and ready for Android via Capacitor/PWA.

**Tech Stack:** TypeScript, Vite, StPageFlip, JSZip, Electron, Lucide Icons, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-16-cross-platform-book-reader-design.md`

## Global Constraints
- Target platforms: Linux Desktop, Windows Desktop, Android Mobile/Tablet.
- Codebase language: TypeScript (strict mode).
- Offline-first: 100% functional without internet connectivity.
- Architecture: Pluggable `DocumentEngine` interface for all document formats.
- Animation: Realistic 3D paper curl with shadow and curvature.
- Layout: Adaptive dual-page spread on wide screens (>= 900px), single page on narrow/mobile (< 900px).
- Reflow: Dynamic pagination scaling with window resize, maintaining reading progress %.

## Review Focus
1. Window resize reflow during active reading maintains the exact paragraph/progress location without crashing or shifting pages unexpectedly.
2. EPUB files with complex nested XHTML, styling, and embedded images render cleanly without breaking the page flip layout.
3. Rapid page turning via keyboard arrow keys or touch swipe stays responsive without tearing or dropping animation frames.
4. Storage persistence across app restarts restores imported books, bookmarks, highlights, and exact reading positions.
5. Desktop keyboard shortcuts (Arrow Left/Right, Up/Down) and mobile touch/volume buttons work reliably across viewports.

---

### Task 1: Project Scaffolding & Build Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `index.html`

- [ ] **Step 1.1**: Initialize `package.json` with dependencies (`page-flip`, `jszip`, `lucide`, `electron`, `vite`, `vitest`, `typescript`).
- [ ] **Step 1.2**: Configure `tsconfig.json` and `vite.config.ts` for modern browser and Electron build outputs.
- [ ] **Step 1.3**: Configure Vitest test runner for unit tests.
- [ ] **Step 1.4**: Create `electron/main.ts` and `electron/preload.ts` to manage native desktop windows on Linux/Windows.
- [ ] **Step 1.5**: Create base `index.html` with viewport, typography meta, and container elements.
- [ ] **Step 1.6**: Run `npm install` and verify `npm test` runs cleanly.
- [ ] **Step 1.7**: Commit scaffolding to git.

---

### Task 2: Modular Document Engine Abstraction & Registry

**Files:**
- Create: `src/core/engine/types.ts`
- Create: `src/core/engine/DocumentRegistry.ts`
- Test: `tests/unit/DocumentRegistry.test.ts`

- [ ] **Step 2.1**: Write failing unit test for `DocumentRegistry` (registration, auto-detection by format, error on unknown format).
- [ ] **Step 2.2**: Define TypeScript interfaces in `src/core/engine/types.ts` (`DocumentEngine`, `DocumentMetadata`, `TocItem`, `VirtualPage`, `PaginationConfig`).
- [ ] **Step 2.3**: Implement `DocumentRegistry` in `src/core/engine/DocumentRegistry.ts`.
- [ ] **Step 2.4**: Run `npm test` to verify `DocumentRegistry` tests pass.
- [ ] **Step 2.5**: Commit modular engine interfaces and registry to git.

---

### Task 3: Native EPUB Parser Engine (`EpubEngine`) & Stubs

**Files:**
- Create: `src/core/engine/epub/EpubEngine.ts`
- Create: `src/core/engine/pdf/PdfEngineStub.ts`
- Create: `src/core/engine/docx/DocxEngineStub.ts`
- Create: `src/core/engine/epub/xmlUtils.ts`
- Test: `tests/unit/EpubEngine.test.ts`

- [ ] **Step 3.1**: Write failing unit test for `EpubEngine` testing EPUB file identification, metadata parsing, and chapter extraction.
- [ ] **Step 3.2**: Implement XML/OPF parsing helpers in `src/core/engine/epub/xmlUtils.ts`.
- [ ] **Step 3.3**: Implement `EpubEngine` in `src/core/engine/epub/EpubEngine.ts` to decompress zip, read container.xml, extract metadata, cover, TOC, and chapter HTML.
- [ ] **Step 3.4**: Implement modular stubs `PdfEngineStub` and `DocxEngineStub` demonstrating future format extensibility.
- [ ] **Step 3.5**: Run `npm test` to verify `EpubEngine` tests pass.
- [ ] **Step 3.6**: Commit EPUB engine to git.

---

### Task 4: Dynamic Virtual Pagination & Reflow Engine

**Files:**
- Create: `src/core/pagination/PaginationEngine.ts`
- Create: `src/core/pagination/domMeasurer.ts`
- Test: `tests/unit/PaginationEngine.test.ts`

- [ ] **Step 4.1**: Write failing unit test for `PaginationEngine` verifying that long HTML chapters are split into discrete `VirtualPage` objects based on height constraints.
- [ ] **Step 4.2**: Implement DOM-based height measurement and block splitting in `src/core/pagination/domMeasurer.ts`.
- [ ] **Step 4.3**: Implement `PaginationEngine.ts` to orchestrate chapter reflow, paragraph splitting, line calculations, and reading progress preservation.
- [ ] **Step 4.4**: Run `npm test` to verify pagination tests pass.
- [ ] **Step 4.5**: Commit pagination engine to git.

---

### Task 5: 3D Book Page-Flip Controller

**Files:**
- Create: `src/ui/components/PageFlipView.ts`
- Create: `src/ui/styles/page-flip.css`
- Test: `tests/unit/PageFlipView.test.ts`

- [ ] **Step 5.1**: Write unit test verifying page creation, dual-page vs single-page mode selection based on width, and page navigation events.
- [ ] **Step 5.2**: Implement `PageFlipView.ts` wrapping StPageFlip: manages book container, page DOM rendering, corner drag events, and page turn state.
- [ ] **Step 5.3**: Implement realistic 3D paper curl CSS styles, page shadows, and spine lighting in `page-flip.css`.
- [ ] **Step 5.4**: Run `npm test` and verify tests pass.
- [ ] **Step 5.5**: Commit Page-Flip view controller to git.

---

### Task 6: Interaction & Shortcuts Manager (Desktop Keys & Mobile Touch/Volume)

**Files:**
- Create: `src/core/input/ShortcutManager.ts`
- Test: `tests/unit/ShortcutManager.test.ts`

- [ ] **Step 6.1**: Write failing test for `ShortcutManager` testing keyboard events (ArrowLeft, ArrowRight, ArrowUp, ArrowDown, PageUp, PageDown) and mobile swipe/tap zone mapping.
- [ ] **Step 6.2**: Implement `ShortcutManager.ts` with desktop keyboard listener, mobile touch swipe gesture recognizer, and Android volume button listener hook.
- [ ] **Step 6.3**: Run `npm test` to verify shortcut manager tests pass.
- [ ] **Step 6.4**: Commit shortcut manager to git.

---

### Task 7: Eye-Care Themes & Typography System

**Files:**
- Create: `src/core/theme/ThemeManager.ts`
- Create: `src/ui/styles/themes.css`
- Test: `tests/unit/ThemeManager.test.ts`

- [ ] **Step 7.1**: Write unit test for `ThemeManager` testing theme switching (Sepia, Dark, Light) and font settings persistence.
- [ ] **Step 7.2**: Implement `ThemeManager.ts` to handle active theme, font size, line spacing, margins, and font family.
- [ ] **Step 7.3**: Implement CSS variables in `themes.css` for Sepia (warm paper `#FBF0D9`), Dark (`#121212`), and Light (`#F5F6F8`).
- [ ] **Step 7.4**: Run `npm test` to verify theme manager tests pass.
- [ ] **Step 7.5**: Commit themes and typography system to git.

---

### Task 8: Storage Persistence, Bookshelf UI & Full Reader Experience

**Files:**
- Create: `src/core/storage/StorageManager.ts`
- Create: `src/ui/components/Bookshelf.ts`
- Create: `src/ui/components/ReaderApp.ts`
- Create: `src/ui/components/SidebarDrawer.ts`
- Create: `src/ui/styles/main.css`
- Create: `src/assets/sample-book.ts`
- Create: `src/main.ts`

- [ ] **Step 8.1**: Implement `StorageManager.ts` using IndexedDB to store books, progress, bookmarks, and notes.
- [ ] **Step 8.2**: Implement `Bookshelf.ts` for library management (import EPUB, view book covers, reading progress, delete book).
- [ ] **Step 8.3**: Implement `SidebarDrawer.ts` for Table of Contents, Bookmarks, and Full-Text Search.
- [ ] **Step 8.4**: Bundle a rich sample classic EPUB book in `src/assets/sample-book.ts` so the app is instantly readable out-of-the-box.
- [ ] **Step 8.5**: Implement main application coordinator in `src/ui/components/ReaderApp.ts` and bootstrap in `src/main.ts`.
- [ ] **Step 8.6**: Write comprehensive tests and verify with `npm test`.
- [ ] **Step 8.7**: Commit complete UI and storage system to git.

---

### Task 9: Build, Verification & Linux Desktop Testing

**Files:**
- Modify: `package.json` (build scripts)

- [ ] **Step 9.1**: Run `npm test` to verify 100% unit tests passing.
- [ ] **Step 9.2**: Run `npm run build` to verify production Vite bundle builds without errors.
- [ ] **Step 9.3**: Test Electron launch on Linux desktop (`DISPLAY=:0`) and verify UI responsiveness, 3D flip animation, shortcuts, and themes.
- [ ] **Step 9.4**: Document execution instructions in `README.md`.
- [ ] **Step 9.5**: Final commit and verification.
