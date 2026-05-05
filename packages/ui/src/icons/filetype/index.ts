// Glaon file-type icon registry — Phase D.4 of the icon registry
// rollout (#309 / #370). Per-extension SVG glyphs for the canonical
// file types Glaon ships, paired with a typed `fileTypeCatalog`
// array that powers the Storybook catalog page and a
// `fileTypeIconForExtension` helper that `<Table.Cell.FileTypeIcon>`
// (#324 Phase A) calls to swap its neutral `File02` placeholder
// for per-extension artwork.
//
// Phase scope (from #370):
//   - **D.4.a (this):** Document + Spreadsheet + Presentation —
//                       PDF, DOCX, DOC, PAGES, TXT, MD, RTF,
//                       XLSX, XLS, NUMBERS, CSV, PPTX, KEY (13).
//   - D.4.b (next)  :   Image + Audio + Video — PNG, JPG, GIF,
//                       SVG, WEBP, HEIC, MP3, WAV, FLAC, AAC,
//                       MP4, MOV, AVI, MKV, WEBM.
//   - D.4.c         :   Archive + Code + Other — ZIP, RAR, TAR,
//                       7z, JS, TS, JSON, YAML, XML, HTML, CSS,
//                       PY, RB, GO, RS, DMG, EXE, APK.
//
// Each glyph component accepts the narrow `FileTypeIconProps`
// (`className`, `aria-hidden` default true, `aria-label`). All
// glyphs compose the shared `FileShape` primitive (`_shape.tsx`)
// which renders a "file with corner fold" silhouette + a coloured
// extension band — per-category palette keeps a directory listing
// scannable at a glance (blue=document, green=spreadsheet,
// orange=presentation, …).

import type { ComponentType } from 'react';

import { DocFile } from './document/DocFile';
import { DocxFile } from './document/DocxFile';
import { MdFile } from './document/MdFile';
import { PagesFile } from './document/PagesFile';
import { PdfFile } from './document/PdfFile';
import { RtfFile } from './document/RtfFile';
import { TxtFile } from './document/TxtFile';
import { KeyFile } from './presentation/KeyFile';
import { PptxFile } from './presentation/PptxFile';
import { CsvFile } from './spreadsheet/CsvFile';
import { NumbersFile } from './spreadsheet/NumbersFile';
import { XlsFile } from './spreadsheet/XlsFile';
import { XlsxFile } from './spreadsheet/XlsxFile';
import type { FileTypeIconCatalogEntry, FileTypeIconProps } from './types';

export type { FileTypeCategory, FileTypeIconCatalogEntry, FileTypeIconProps } from './types';
export {
  CsvFile,
  DocFile,
  DocxFile,
  KeyFile,
  MdFile,
  NumbersFile,
  PagesFile,
  PdfFile,
  PptxFile,
  RtfFile,
  TxtFile,
  XlsFile,
  XlsxFile,
};

/**
 * Maps a file extension (lowercase, no leading dot — e.g. `'pdf'`,
 * `'docx'`) to the registry's per-extension glyph component.
 * Returns `undefined` when the extension isn't covered so consumers
 * can fall back to a neutral file icon.
 *
 * `<Table.Cell.FileTypeIcon>` calls this internally to swap its
 * leading glyph; consumers who detect the extension upstream
 * (server-side metadata) can call it directly.
 */
export function fileTypeIconForExtension(
  extension: string,
): ComponentType<FileTypeIconProps> | undefined {
  const ext = extension.toLowerCase().replace(/^\./, '');
  switch (ext) {
    // Document
    case 'pdf':
      return PdfFile;
    case 'docx':
      return DocxFile;
    case 'doc':
      return DocFile;
    case 'pages':
      return PagesFile;
    case 'txt':
      return TxtFile;
    case 'md':
    case 'markdown':
      return MdFile;
    case 'rtf':
      return RtfFile;
    // Spreadsheet
    case 'xlsx':
      return XlsxFile;
    case 'xls':
      return XlsFile;
    case 'numbers':
      return NumbersFile;
    case 'csv':
      return CsvFile;
    // Presentation
    case 'pptx':
      return PptxFile;
    case 'key':
    case 'keynote':
      return KeyFile;
    default:
      return undefined;
  }
}

/**
 * Searchable catalog used by the `Foundations / File Type Icons`
 * Storybook docs page. Order is alphabetical within each category
 * so the rendered grid stays predictable for snapshot tests.
 * Future phases (D.4.b–c) append.
 */
export const fileTypeCatalog: readonly FileTypeIconCatalogEntry[] = [
  // --- D.4.a Document ---
  { id: 'doc', label: 'DOC', category: 'document', Icon: DocFile },
  { id: 'docx', label: 'DOCX', category: 'document', Icon: DocxFile },
  { id: 'md', label: 'Markdown', category: 'document', Icon: MdFile },
  { id: 'pages', label: 'Pages', category: 'document', Icon: PagesFile },
  { id: 'pdf', label: 'PDF', category: 'document', Icon: PdfFile },
  { id: 'rtf', label: 'RTF', category: 'document', Icon: RtfFile },
  { id: 'txt', label: 'Text', category: 'document', Icon: TxtFile },
  // --- D.4.a Spreadsheet ---
  { id: 'csv', label: 'CSV', category: 'spreadsheet', Icon: CsvFile },
  { id: 'numbers', label: 'Numbers', category: 'spreadsheet', Icon: NumbersFile },
  { id: 'xls', label: 'XLS', category: 'spreadsheet', Icon: XlsFile },
  { id: 'xlsx', label: 'XLSX', category: 'spreadsheet', Icon: XlsxFile },
  // --- D.4.a Presentation ---
  { id: 'key', label: 'Keynote', category: 'presentation', Icon: KeyFile },
  { id: 'pptx', label: 'PPTX', category: 'presentation', Icon: PptxFile },
];
