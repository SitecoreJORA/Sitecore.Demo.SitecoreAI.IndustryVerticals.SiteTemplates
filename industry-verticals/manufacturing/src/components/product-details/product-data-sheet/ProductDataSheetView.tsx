import { useMemo } from 'react';
import { cn } from '@/shadcn/lib/utils';
import type { DataSheetDocument, Diagram, DiagramDataDocument } from '@/types/product-data-sheet';
import { getCategoryColor, getCategoryLabel } from '@/types/product-data-sheet';
import { DataSheetBlockRenderer } from './DataSheetBlockRenderer';

export interface ProductDataSheetViewProps {
  document: DataSheetDocument;
  /** Populated when `sCHOTT_DiagramData` (or equivalent) is available alongside the datasheet JSON. */
  diagramData?: DiagramDataDocument | null;
}

export function ProductDataSheetView({ document, diagramData }: ProductDataSheetViewProps) {
  const sections = useMemo(
    () => [...document.sections].sort((a, b) => a.order - b.order),
    [document.sections]
  );

  const diagramsById = useMemo(() => {
    const map = new Map<string, Diagram>();
    const diagrams = diagramData?.diagrams ?? [];
    for (const d of diagrams) {
      const id = d?.id?.trim();
      if (id) map.set(id, d);
    }
    return map;
  }, [diagramData]);

  if (sections.length === 0) {
    return <p className="text-foreground-muted text-sm">No datasheet sections in this document.</p>;
  }

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section
          key={section.id}
          className="border-border scroll-mt-8 border-b pb-10 last:border-b-0 last:pb-0"
        >
          <header className="mb-6 flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-bold">{section.title}</h3>
            {section.category ? (
              <span
                className={cn('rounded-full px-3 py-0.5 text-xs font-medium text-white')}
                style={{
                  backgroundColor: getCategoryColor(section.category, document.customCategories),
                }}
              >
                {getCategoryLabel(section.category, document.customCategories)}
              </span>
            ) : null}
          </header>
          <div className="space-y-8">
            {section.content.map((block) => (
              <div key={block.id}>
                <DataSheetBlockRenderer block={block} diagramsById={diagramsById} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
