import type { DataSheetDocument, DiagramDataDocument } from '@/types/product-data-sheet';

export function parseDataSheetJson(raw: string | null): DataSheetDocument | null {
  if (!raw?.trim()) return null;
  try {
    const doc = JSON.parse(raw) as unknown;
    if (!doc || typeof doc !== 'object') return null;
    const d = doc as Partial<DataSheetDocument>;
    if (!Array.isArray(d.sections)) return null;
    return {
      version: 1,
      sections: d.sections,
      customCategories: Array.isArray(d.customCategories) ? d.customCategories : undefined,
    };
  } catch {
    return null;
  }
}

export function parseDiagramDataJson(raw: string | null): DiagramDataDocument | null {
  if (!raw?.trim()) return null;
  try {
    const doc = JSON.parse(raw) as unknown;
    if (!doc || typeof doc !== 'object') return null;
    const d = doc as Partial<DiagramDataDocument>;
    if (!Array.isArray(d.diagrams)) return null;
    return {
      version: 1,
      diagrams: d.diagrams,
    };
  } catch {
    return null;
  }
}
