import { DocumentEngine } from './types';

export class DocumentRegistry {
  private static engines: DocumentEngine[] = [];

  /**
   * Register a new document engine implementation (e.g. EpubEngine, PdfEngine, DocxEngine).
   */
  static register(engine: DocumentEngine): void {
    const existingIndex = this.engines.findIndex((e) => e.format === engine.format);
    if (existingIndex >= 0) {
      this.engines[existingIndex] = engine;
    } else {
      this.engines.push(engine);
    }
  }

  /**
   * Find an engine capable of handling the provided file data or file name.
   */
  static getEngineForFile(fileData: ArrayBuffer | Uint8Array, fileName: string): DocumentEngine {
    const matched = this.engines.find((engine) => engine.canHandle(fileData, fileName));
    if (!matched) {
      const ext = fileName.includes('.') ? fileName.split('.').pop() : 'unknown';
      throw new Error(`Unsupported document format: ".${ext}". Registered formats: ${this.getSupportedFormats().join(', ')}`);
    }
    return matched;
  }

  /**
   * Returns a list of supported formats (e.g. ['epub', 'pdf', 'docx']).
   */
  static getSupportedFormats(): string[] {
    return this.engines.map((e) => e.format);
  }

  /**
   * Clear all registered engines (useful for tests).
   */
  static clear(): void {
    this.engines = [];
  }
}
