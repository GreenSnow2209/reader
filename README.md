# Lumina Reader 📖✨

> Ứng dụng đọc sách đa nền tảng (Linux, Windows, Android) với kiến trúc module mở rộng, hiệu ứng lật trang 3D chân thực, tự động dàn trang responsive và chế độ bảo vệ mắt (Eye-care).

![Lumina Reader](https://img.shields.io/badge/Platform-Linux%20%7C%20Windows%20%7C%20Android-blue)
![Architecture](https://img.shields.io/badge/Architecture-Modular%20Plugin%20Engine-brightgreen)
![License](https://img.shields.io/badge/License-MIT-orange)

---

## 🌟 Tính Năng Nổi Bật

1. **Kiến Trúc Module Mở Rộng (Modular Document Engine)**:
   - Hỗ trợ định dạng **EPUB 3** hoàn chỉnh (giải nén ZIP, phân tích OPF, NCX/Navigation Document, tự động inline hình ảnh).
   - Thiết kế theo mẫu thiết kế Factory & Plugin qua interface `DocumentEngine`. Sau này muốn hỗ trợ thêm **PDF** hay **DOCX (Word)** chỉ cần implement class tương ứng và đăng ký vào `DocumentRegistry` mà không cần sửa giao diện hay logic lật trang.

2. **Hiệu Ứng Lật Sách 3D Chân Thực (Page-Curl Physics)**:
   - Mô phỏng vật lý uốn cong trang sách 3D (StPageFlip), bóng đổ tự nhiên theo nếp gấp giữa 2 trang (Spine crease shadow).
   - Hỗ trợ dùng chuột kéo góc sách để uốn lật hoặc click/phím tắt để lật mượt mà.

3. **Dàn Trang Thích Ứng & Tự Động Scale (Adaptive Dynamic Reflow)**:
   - **Màn hình rộng (Desktop / Tablet ngang)**: Tự động hiển thị **2 trang mở song song** như một cuốn sách thật đang mở.
   - **Màn hình hẹp (Mobile / Cửa sổ nhỏ)**: Tự động chuyển về **1 trang đơn** căn giữa.
   - Khi co giãn kích thước cửa sổ (Window resize) hoặc đổi cỡ chữ/lề, engine tự động tính toán lại số lượng chữ trên mỗi trang mà **không làm mất vị trí / % đang đọc dở**.

4. **Hệ Thống Phím Tắt & Cử Chỉ Thông Minh**:
   - **Desktop**:
     - `Mũi tên Phải (→)`, `Mũi tên Xuống (↓)`, `PageDown`, `Space`: Sang trang kế tiếp.
     - `Mũi tên Trái (←)`, `Mũi tên Lên (↑)`, `PageUp`, `Shift + Space`: Quay lại trang trước.
     - `F11`: Bật / tắt chế độ đọc toàn màn hình (Fullscreen).
     - `Escape`: Đóng menu / mục lục.
   - **Mobile (Android)**:
     - Vuốt màn hình sang trái/phải để lật trang.
     - Chạm 20% mép trái để lùi trang, chạm 20% mép phải để sang trang, chạm giữa màn hình để mở thanh công cụ.
     - **Phím cứng Volume Up/Down**: Bấm nút giảm âm lượng để sang trang tiếp, tăng âm lượng để lùi trang.

5. **Bộ Theme Bảo Vệ Mắt (Eye-Care Themes)**:
   - **Sepia (Giấy ngà / Antique Paper)**: Nền vàng kem dịu mắt `#FBF0D9`, chữ nâu sẫm `#382D21`, lọc ánh sáng xanh giúp đọc lâu không mỏi mắt.
   - **Dark Mode (Đêm / OLED)**: Nền tối `#1B1B1F`, chữ xám sáng dịu, chống chói trong bóng tối.
   - **Light Mode (Ban ngày)**: Nền trắng sạch sẽ `#FFFFFF`, tương phản chuẩn mực.
   - Tùy chỉnh trực tiếp: Cỡ chữ (12px - 28px), khoảng cách dòng (1.3 - 2.2), phông chữ có chân (Serif) hoặc không chân (Sans).

6. **Các Tiện Ích Đọc Sách Hoàn Chỉnh**:
   - **Kệ sách cá nhân (Bookshelf)**: Xem danh sách sách đã lưu, ảnh bìa, tiến độ % đã đọc, thêm sách mới qua kéo thả (drag & drop) hoặc file picker. Sẵn sàng kèm theo cuốn kinh điển *"Hoàng Tử Bé (Le Petit Prince)"* khi mở ứng dụng lần đầu.
   - **Mục lục (Table of Contents)**: Nhảy trực tiếp đến bất kỳ chương nào.
   - **Đánh dấu trang (Bookmarks)**: Lưu lại các trang tâm đắc cùng đoạn trích văn bản và thời gian.
   - **Tìm kiếm từ khóa (Full-Text Search)**: Tìm nhanh mọi câu từ trong toàn bộ cuốn sách, hiển thị trích đoạn có highlight vàng và bấm để nhảy ngay tới trang đó.

---

## 🏗️ Kiến Trúc Module & Mở Rộng Định Dạng

Hệ thống được thiết kế với tính phân tách cao (Loose Coupling):

```
src/
├── core/
│   ├── engine/
│   │   ├── types.ts              # Định nghĩa Interface DocumentEngine, VirtualPage, TocItem
│   │   ├── DocumentRegistry.ts   # Quản lý & điều phối engine theo định dạng file
│   │   ├── epub/
│   │   │   ├── EpubEngine.ts     # Bộ giải mã & đọc EPUB hoàn chỉnh
│   │   │   └── xmlUtils.ts       # Xử lý XML DOM, OPF và NCX TOC
│   │   ├── pdf/
│   │   │   └── PdfEngineStub.ts  # Module cắm thêm cho PDF (sẵn sàng tích hợp pdfjs)
│   │   └── docx/
│   │       └── DocxEngineStub.ts # Module cắm thêm cho Word DOCX (sẵn sàng tích hợp mammoth)
│   ├── pagination/
│   │   ├── PaginationEngine.ts   # Chia trang ảo & dàn trang reflow theo kích thước khung nhìn
│   │   └── domMeasurer.ts        # Đo đạc kích thước khối văn bản chính xác
│   ├── input/
│   │   └── ShortcutManager.ts    # Bắt phím Desktop, cảm ứng vuốt & phím Volume Android
│   ├── theme/
│   │   └── ThemeManager.ts       # Quản lý Sepia / Dark / Light & Typography
│   └── storage/
│       └── StorageManager.ts     # Lưu trữ offline qua IndexedDB (sách, tiến độ %, bookmarks)
├── ui/
│   ├── components/
│   │   ├── Bookshelf.ts          # Kệ sách chính
│   │   ├── ReaderApp.ts          # Bộ điều phối màn hình đọc sách
│   │   ├── PageFlipView.ts       # Điều khiển hiệu ứng lật sách 3D (StPageFlip)
│   │   └── SidebarDrawer.ts      # Menu trượt: Mục lục, Đánh dấu, Tìm kiếm, Cài đặt
│   └── styles/
│       ├── themes.css            # Biến màu sắc & typography
│       ├── page-flip.css         # Đổ bóng sách 3D, gáy sách & trang giấy
│       └── main.css              # Layout hoàn chỉnh
└── electron/
    ├── main.ts                   # Cửa sổ desktop native cho Linux & Windows
    └── preload.ts                # Cầu nối an toàn IPC giữa Electron và Web
```

### Cách cắm thêm module định dạng mới (Ví dụ: PDF hay Word)
Chỉ cần tạo class thực thi interface `DocumentEngine` và đăng ký trong `src/main.ts`:
```typescript
import { DocumentRegistry } from './core/engine/DocumentRegistry';
import { PdfEngine } from './core/engine/pdf/PdfEngine';

DocumentRegistry.register(new PdfEngine());
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Yêu cầu hệ thống
- Đã cài đặt **Node.js** (v18+) hoặc **Bun** (v1.0+).

### 2. Cài đặt thư viện
```bash
bun install
# hoặc: npm install
```

### 3. Chạy kiểm thử tự động (Unit Tests)
```bash
bun run test
# hoặc: npm test
```

### 4. Chạy chế độ Web / Mobile Browser (Hỗ trợ PWA)
```bash
bun run dev
# Mở trình duyệt tại http://localhost:5173
```

### 5. Chạy ứng dụng Desktop Native (Linux / Windows)
```bash
bun run electron:dev
# hoặc: npm run electron:dev
```

### 6. Đóng gói cho Android (Capacitor / PWA)
Mã nguồn đã được xây dựng theo chuẩn PWA và tương thích 100% với `@capacitor/core`:
```bash
bun run build
# Copy thư mục dist/ vào dự án Capacitor Android để build ra file .apk
```
