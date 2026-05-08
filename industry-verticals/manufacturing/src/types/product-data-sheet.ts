/**
 * SCHOTT product datasheet JSON model (Content Hub).
 * Mirrors the editor document shape from schott-datasheet-editor.
 */

export interface DataSheetDocument {
  version: 1;
  sections: Section[];
  customCategories?: CustomCategory[];
}

export interface Section {
  id: string;
  title: string;
  order: number;
  category?: string;
  content: ContentBlock[];
}

export type SectionCategory =
  | 'thermal'
  | 'mechanical'
  | 'optical'
  | 'chemical'
  | 'electrical'
  | 'general';

export interface CustomCategory {
  id: string;
  label: string;
  color: string;
}

export type ContentBlock =
  | KeyValueTableBlock
  | SimpleTableBlock
  | ComplexTableBlock
  | TextBlock
  | DiagramRefBlock
  | ContentHubImageBlock;

export interface KeyValueTableBlock {
  type: 'key-value-table';
  id: string;
  title?: string;
  entries: KVEntry[];
}

export interface KVEntry {
  key: string;
  value: string;
  unit?: string;
  standard?: string;
  footnote?: string;
}

export interface SimpleTableBlock {
  type: 'simple-table';
  id: string;
  title?: string;
  columns: SimpleColumnDef[];
  rows: SimpleTableRow[];
  caption?: string;
}

export interface SimpleColumnDef {
  key: string;
  label: string;
}

export interface SimpleTableRow {
  cells: Record<string, string>;
}

export interface ComplexTableBlock {
  type: 'complex-table';
  id: string;
  title?: string;
  columns: ColumnDef[];
  groups: RowGroup[];
  footnotes?: string[];
}

export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
}

export interface RowGroup {
  header?: string;
  rows: TableRow[];
}

export interface TableRow {
  cells: Record<string, CellValue>;
}

export type CellValue =
  | string
  | {
      value: string;
      rowSpan?: number;
      colSpan?: number;
      footnoteRef?: number;
    };

export interface TextBlock {
  type: 'text';
  id: string;
  content: string;
}

export interface DiagramRefBlock {
  type: 'diagram-ref';
  id: string;
  diagramId: string;
  title?: string;
  caption?: string;
}

export interface ContentHubImageBlock {
  type: 'content-hub-image';
  id: string;
  assetId?: number;
  assetTitle?: string;
  publicUrl?: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
}

export interface DiagramDataDocument {
  version: 1;
  diagrams: Diagram[];
}

export interface Diagram {
  id: string;
  title: string;
  chartType: 'line' | 'scatter';
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  series: DiagramSeries[];
  annotations?: Annotation[];
  sourceFile?: string;
  lastModified?: string;
}

export interface AxisConfig {
  label: string;
  unit?: string;
}

export interface DiagramSeries {
  name: string;
  color?: string;
  data: [number, number][];
}

export interface Annotation {
  x: number;
  y: number;
  label: string;
  display?: 'below' | 'inside';
}

export const CATEGORY_LABELS: Record<SectionCategory, string> = {
  thermal: 'Thermal',
  mechanical: 'Mechanical',
  optical: 'Optical',
  chemical: 'Chemical',
  electrical: 'Electrical',
  general: 'General',
};

export const CATEGORY_COLORS: Record<SectionCategory, string> = {
  thermal: '#E74C3C',
  mechanical: '#3498DB',
  optical: '#F39C12',
  chemical: '#2ECC71',
  electrical: '#9B59B6',
  general: '#95A5A6',
};

const DEFAULT_CATEGORY_COLOR = '#95A5A6';

export function getCategoryLabel(id: string | undefined, custom?: CustomCategory[]): string {
  if (!id) return '';
  if ((CATEGORY_LABELS as Record<string, string>)[id]) {
    return (CATEGORY_LABELS as Record<string, string>)[id];
  }
  const found = (custom || []).find((c) => c.id === id);
  return found ? found.label : id;
}

export function getCategoryColor(id: string | undefined, custom?: CustomCategory[]): string {
  if (!id) return DEFAULT_CATEGORY_COLOR;
  if ((CATEGORY_COLORS as Record<string, string>)[id]) {
    return (CATEGORY_COLORS as Record<string, string>)[id];
  }
  const found = (custom || []).find((c) => c.id === id);
  return found ? found.color : DEFAULT_CATEGORY_COLOR;
}
