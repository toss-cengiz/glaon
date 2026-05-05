// Glaon file-type icon registry — Phase D.4 of the icon registry
// rollout (#309 / #370). Per-extension SVG glyphs for the canonical
// file types Glaon ships, paired with a typed `fileTypeCatalog`
// array that powers the Storybook catalog page and a
// `fileTypeIconForExtension` helper that `<Table.Cell.FileTypeIcon>`
// (#324 Phase A) calls to swap its neutral `File02` placeholder
// for per-extension artwork.
//
// Phase scope (from #370):
//   - D.4.a (shipped): Document + Spreadsheet + Presentation —
//                       PDF, DOCX, DOC, PAGES, TXT, MD, RTF,
//                       XLSX, XLS, NUMBERS, CSV, PPTX, KEY (13).
//   - D.4.b (shipped): Image + Audio + Video — PNG, JPG, GIF,
//                       SVG, WEBP, HEIC, RAW, MP3, WAV, FLAC, AAC,
//                       MP4, MOV, AVI, MKV, WEBM (16).
//   - **D.4.c (this):** Archive + Code + Other — ZIP, RAR, TAR,
//                       7z, JS, TS, JSON, YAML, XML, HTML, CSS,
//                       PY, RB, GO, RS, DMG, EXE, APK (18).
//
// Each glyph component accepts the narrow `FileTypeIconProps`
// (`className`, `aria-hidden` default true, `aria-label`). All
// glyphs compose the shared `FileShape` primitive (`_shape.tsx`)
// which renders a "file with corner fold" silhouette + a coloured
// extension band — per-category palette keeps a directory listing
// scannable at a glance (blue=document, green=spreadsheet,
// orange=presentation, emerald=image, purple=audio, pink=video,
// red=archive, sky=code, gray=other).

import type { ComponentType } from 'react';

import { RarFile } from './archive/RarFile';
import { SevenZipFile } from './archive/SevenZipFile';
import { TarFile } from './archive/TarFile';
import { ZipFile } from './archive/ZipFile';
import { AacFile } from './audio/AacFile';
import { FlacFile } from './audio/FlacFile';
import { Mp3File } from './audio/Mp3File';
import { WavFile } from './audio/WavFile';
import { CssFile } from './code/CssFile';
import { GoFile } from './code/GoFile';
import { HtmlFile } from './code/HtmlFile';
import { JsFile } from './code/JsFile';
import { JsonFile } from './code/JsonFile';
import { PyFile } from './code/PyFile';
import { RbFile } from './code/RbFile';
import { RsFile } from './code/RsFile';
import { TsFile } from './code/TsFile';
import { XmlFile } from './code/XmlFile';
import { YamlFile } from './code/YamlFile';
import { DocFile } from './document/DocFile';
import { DocxFile } from './document/DocxFile';
import { MdFile } from './document/MdFile';
import { PagesFile } from './document/PagesFile';
import { PdfFile } from './document/PdfFile';
import { RtfFile } from './document/RtfFile';
import { TxtFile } from './document/TxtFile';
import { GifFile } from './image/GifFile';
import { HeicFile } from './image/HeicFile';
import { JpgFile } from './image/JpgFile';
import { PngFile } from './image/PngFile';
import { RawFile } from './image/RawFile';
import { SvgFile } from './image/SvgFile';
import { WebpFile } from './image/WebpFile';
import { ApkFile } from './other/ApkFile';
import { DmgFile } from './other/DmgFile';
import { ExeFile } from './other/ExeFile';
import { KeyFile } from './presentation/KeyFile';
import { PptxFile } from './presentation/PptxFile';
import { CsvFile } from './spreadsheet/CsvFile';
import { NumbersFile } from './spreadsheet/NumbersFile';
import { XlsFile } from './spreadsheet/XlsFile';
import { XlsxFile } from './spreadsheet/XlsxFile';
import { AviFile } from './video/AviFile';
import { MkvFile } from './video/MkvFile';
import { MovFile } from './video/MovFile';
import { Mp4File } from './video/Mp4File';
import { WebmFile } from './video/WebmFile';
import type { FileTypeIconCatalogEntry, FileTypeIconProps } from './types';

export type { FileTypeCategory, FileTypeIconCatalogEntry, FileTypeIconProps } from './types';
export {
  AacFile,
  ApkFile,
  AviFile,
  CssFile,
  CsvFile,
  DmgFile,
  DocFile,
  DocxFile,
  ExeFile,
  FlacFile,
  GifFile,
  GoFile,
  HeicFile,
  HtmlFile,
  JpgFile,
  JsFile,
  JsonFile,
  KeyFile,
  MdFile,
  MkvFile,
  MovFile,
  Mp3File,
  Mp4File,
  NumbersFile,
  PagesFile,
  PdfFile,
  PngFile,
  PptxFile,
  PyFile,
  RarFile,
  RawFile,
  RbFile,
  RsFile,
  RtfFile,
  SevenZipFile,
  SvgFile,
  TarFile,
  TsFile,
  TxtFile,
  WavFile,
  WebmFile,
  WebpFile,
  XlsFile,
  XlsxFile,
  XmlFile,
  YamlFile,
  ZipFile,
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
    // Image
    case 'png':
      return PngFile;
    case 'jpg':
    case 'jpeg':
      return JpgFile;
    case 'gif':
      return GifFile;
    case 'svg':
      return SvgFile;
    case 'webp':
      return WebpFile;
    case 'heic':
    case 'heif':
      return HeicFile;
    case 'raw':
    case 'cr2':
    case 'nef':
    case 'arw':
    case 'dng':
      return RawFile;
    // Audio
    case 'mp3':
      return Mp3File;
    case 'wav':
      return WavFile;
    case 'flac':
      return FlacFile;
    case 'aac':
    case 'm4a':
      return AacFile;
    // Video
    case 'mp4':
    case 'm4v':
      return Mp4File;
    case 'mov':
      return MovFile;
    case 'avi':
      return AviFile;
    case 'mkv':
      return MkvFile;
    case 'webm':
      return WebmFile;
    // Archive
    case 'zip':
      return ZipFile;
    case 'rar':
      return RarFile;
    case 'tar':
    case 'tgz':
    case 'gz':
      return TarFile;
    case '7z':
      return SevenZipFile;
    // Code
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'jsx':
      return JsFile;
    case 'ts':
    case 'tsx':
      return TsFile;
    case 'json':
      return JsonFile;
    case 'yaml':
    case 'yml':
      return YamlFile;
    case 'xml':
      return XmlFile;
    case 'html':
    case 'htm':
      return HtmlFile;
    case 'css':
      return CssFile;
    case 'py':
      return PyFile;
    case 'rb':
      return RbFile;
    case 'go':
      return GoFile;
    case 'rs':
      return RsFile;
    // Other
    case 'dmg':
      return DmgFile;
    case 'exe':
    case 'msi':
      return ExeFile;
    case 'apk':
      return ApkFile;
    default:
      return undefined;
  }
}

/**
 * Searchable catalog used by the `Foundations / File Type Icons`
 * Storybook docs page. Order is alphabetical within each category
 * so the rendered grid stays predictable for snapshot tests.
 * Phase D.4 ships all categories; new aliases land in the helper
 * switch above without changing the catalog.
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
  // --- D.4.b Image ---
  { id: 'gif', label: 'GIF', category: 'image', Icon: GifFile },
  { id: 'heic', label: 'HEIC', category: 'image', Icon: HeicFile },
  { id: 'jpg', label: 'JPG', category: 'image', Icon: JpgFile },
  { id: 'png', label: 'PNG', category: 'image', Icon: PngFile },
  { id: 'raw', label: 'RAW', category: 'image', Icon: RawFile },
  { id: 'svg', label: 'SVG', category: 'image', Icon: SvgFile },
  { id: 'webp', label: 'WEBP', category: 'image', Icon: WebpFile },
  // --- D.4.b Audio ---
  { id: 'aac', label: 'AAC', category: 'audio', Icon: AacFile },
  { id: 'flac', label: 'FLAC', category: 'audio', Icon: FlacFile },
  { id: 'mp3', label: 'MP3', category: 'audio', Icon: Mp3File },
  { id: 'wav', label: 'WAV', category: 'audio', Icon: WavFile },
  // --- D.4.b Video ---
  { id: 'avi', label: 'AVI', category: 'video', Icon: AviFile },
  { id: 'mkv', label: 'MKV', category: 'video', Icon: MkvFile },
  { id: 'mov', label: 'MOV', category: 'video', Icon: MovFile },
  { id: 'mp4', label: 'MP4', category: 'video', Icon: Mp4File },
  { id: 'webm', label: 'WEBM', category: 'video', Icon: WebmFile },
  // --- D.4.c Archive ---
  { id: '7z', label: '7z', category: 'archive', Icon: SevenZipFile },
  { id: 'rar', label: 'RAR', category: 'archive', Icon: RarFile },
  { id: 'tar', label: 'TAR', category: 'archive', Icon: TarFile },
  { id: 'zip', label: 'ZIP', category: 'archive', Icon: ZipFile },
  // --- D.4.c Code ---
  { id: 'css', label: 'CSS', category: 'code', Icon: CssFile },
  { id: 'go', label: 'Go', category: 'code', Icon: GoFile },
  { id: 'html', label: 'HTML', category: 'code', Icon: HtmlFile },
  { id: 'js', label: 'JS', category: 'code', Icon: JsFile },
  { id: 'json', label: 'JSON', category: 'code', Icon: JsonFile },
  { id: 'py', label: 'Python', category: 'code', Icon: PyFile },
  { id: 'rb', label: 'Ruby', category: 'code', Icon: RbFile },
  { id: 'rs', label: 'Rust', category: 'code', Icon: RsFile },
  { id: 'ts', label: 'TS', category: 'code', Icon: TsFile },
  { id: 'xml', label: 'XML', category: 'code', Icon: XmlFile },
  { id: 'yaml', label: 'YAML', category: 'code', Icon: YamlFile },
  // --- D.4.c Other ---
  { id: 'apk', label: 'APK', category: 'other', Icon: ApkFile },
  { id: 'dmg', label: 'DMG', category: 'other', Icon: DmgFile },
  { id: 'exe', label: 'EXE', category: 'other', Icon: ExeFile },
];
