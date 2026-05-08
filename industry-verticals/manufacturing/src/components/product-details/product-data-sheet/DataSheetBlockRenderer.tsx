import React from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/shadcn/lib/utils';
import type {
  CellValue,
  ComplexTableBlock,
  ContentBlock,
  ContentHubImageBlock,
  Diagram,
  DiagramRefBlock,
  KeyValueTableBlock,
  SimpleTableBlock,
  TextBlock,
} from '@/types/product-data-sheet';
import { toSafeHtml } from '@/utils/product-data-sheet/richText';

const DiagramChart = dynamic(() => import('./DiagramChart'), {
  ssr: false,
  loading: () => <p className="text-foreground-muted text-sm italic">Loading chart…</p>,
});

function BlockTitle({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <h4 className="mb-3 text-base font-semibold">{children}</h4>;
}

function TextBlockView({ block }: { block: TextBlock }) {
  const html = toSafeHtml(block.content || '');
  if (!html.trim()) return null;
  return (
    <div
      className={cn(
        'datasheet-text max-w-none text-sm leading-relaxed',
        '[&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6',
        '[&_p]:mb-3 [&_strong]:font-semibold [&_sub]:text-xs [&_sup]:text-xs',
        '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6'
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function SimpleTableView({ block }: { block: SimpleTableBlock }) {
  if (block.columns.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      {block.title && <BlockTitle>{block.title}</BlockTitle>}
      <table className="border-border w-full border-collapse overflow-hidden rounded-md border text-sm">
        <thead>
          <tr className="bg-muted/80">
            {block.columns.map((col) => (
              <th
                key={col.key}
                className="border-border border px-3 py-2 text-left font-medium whitespace-pre-wrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => (
            <tr key={ri} className={cn(ri % 2 === 1 && 'bg-muted/25')}>
              {block.columns.map((col) => (
                <td
                  key={col.key}
                  className="border-border border px-3 py-2 align-top whitespace-pre-wrap"
                >
                  {row.cells[col.key] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {block.caption && (
        <p className="text-foreground-muted mt-3 text-xs whitespace-pre-wrap">{block.caption}</p>
      )}
    </div>
  );
}

function KeyValueTableView({ block }: { block: KeyValueTableBlock }) {
  return (
    <div className="overflow-x-auto">
      {block.title && <BlockTitle>{block.title}</BlockTitle>}
      <table className="border-border w-full border-collapse overflow-hidden rounded-md border text-sm">
        <tbody>
          {block.entries.map((entry, i) => (
            <tr key={i} className={cn(i % 2 === 1 && 'bg-muted/25')}>
              <td className="border-border max-w-[45%] border px-3 py-2 font-medium">
                {entry.key}
                {entry.standard && (
                  <span className="text-foreground-muted font-normal"> ({entry.standard})</span>
                )}
              </td>
              <td className="border-border border px-3 py-2">{entry.value}</td>
              <td className="border-border text-foreground-muted w-24 border px-3 py-2">
                {entry.unit ?? ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {block.entries.some((e) => e.footnote) && (
        <div className="text-foreground-muted mt-3 space-y-1 text-xs">
          {block.entries
            .filter((e) => e.footnote)
            .map((e, i) => (
              <p key={i}>* {e.footnote}</p>
            ))}
        </div>
      )}
    </div>
  );
}

function getCellProps(cell: CellValue): {
  value: string;
  rowSpan?: number;
  colSpan?: number;
  footnoteRef?: number;
} {
  if (typeof cell === 'string') return { value: cell };
  return cell;
}

function ComplexTableView({ block }: { block: ComplexTableBlock }) {
  return (
    <div className="overflow-x-auto">
      {block.title && <BlockTitle>{block.title}</BlockTitle>}
      <table className="border-border w-full border-collapse overflow-hidden rounded-md border text-sm">
        <thead>
          <tr className="bg-muted/80">
            {block.columns.map((col) => (
              <th
                key={col.key}
                className="border-border border px-3 py-2 text-left font-medium"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.groups.map((group, gi) => (
            <React.Fragment key={`complex-group-${gi}-${group.header ?? ''}`}>
              {group.header && (
                <tr className="bg-muted/40">
                  <td
                    colSpan={block.columns.length}
                    className="border-border border px-3 py-2 font-semibold"
                  >
                    {group.header}
                  </td>
                </tr>
              )}
              {group.rows.map((row, ri) => (
                <tr key={ri} className={cn(ri % 2 === 1 && 'bg-muted/25')}>
                  {block.columns.map((col) => {
                    const raw = row.cells[col.key];
                    if (raw === undefined)
                      return <td key={col.key} className="border-border border px-3 py-2" />;
                    const cell = getCellProps(raw);
                    if (cell.value === '__spanned__') return null;
                    return (
                      <td
                        key={col.key}
                        className="border-border border px-3 py-2 align-top"
                        rowSpan={cell.rowSpan}
                        colSpan={cell.colSpan}
                      >
                        {cell.value}
                        {cell.footnoteRef != null && (
                          <sup className="text-accent ml-0.5">{cell.footnoteRef}</sup>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {block.footnotes && block.footnotes.length > 0 && (
        <div className="text-foreground-muted mt-3 space-y-1 text-xs">
          {block.footnotes.map((fn, i) => (
            <p key={i}>
              <sup>{i + 1}</sup> {fn}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function ContentHubImageView({ block }: { block: ContentHubImageBlock }) {
  const imageUrl = block.publicUrl || block.thumbnailUrl;
  if (!imageUrl) {
    return (
      <div className="border-border bg-muted/30 text-foreground-muted rounded-md border border-dashed px-4 py-8 text-center text-sm">
        No image URL
      </div>
    );
  }
  return (
    <figure className="space-y-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- remote Content Hub URLs vary per tenant */}
      <img
        src={imageUrl}
        alt={block.alt || block.assetTitle || ''}
        className="border-border h-auto max-h-[480px] w-full rounded-md border object-contain"
        loading="lazy"
      />
      {block.caption && (
        <figcaption className="text-foreground-muted text-xs">{block.caption}</figcaption>
      )}
    </figure>
  );
}

function DiagramRefView({
  block,
  diagram,
}: {
  block: DiagramRefBlock;
  diagram: Diagram | undefined;
}) {
  const id = block.diagramId?.trim();
  if (!id) return null;

  if (!diagram) {
    return (
      <div className="border-border bg-muted/30 text-foreground-muted rounded-md border px-4 py-6 text-center text-sm">
        Diagram data is not available for this product (
        <span className="font-mono text-xs">{id}</span>). When{' '}
        <code className="bg-muted rounded px-1 py-0.5 text-xs">sCHOTT_DiagramData</code> is exposed
        via the datasheet API, charts will render here.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {block.title && <BlockTitle>{block.title}</BlockTitle>}
      <DiagramChart diagram={diagram} />
      {block.caption && <p className="text-foreground-muted text-xs">{block.caption}</p>}
    </div>
  );
}

export interface DataSheetBlockRendererProps {
  block: ContentBlock;
  diagramsById: Map<string, Diagram>;
}

export function DataSheetBlockRenderer({ block, diagramsById }: DataSheetBlockRendererProps) {
  switch (block.type) {
    case 'key-value-table':
      return <KeyValueTableView block={block} />;
    case 'simple-table':
      return <SimpleTableView block={block} />;
    case 'complex-table':
      return <ComplexTableView block={block} />;
    case 'text':
      return <TextBlockView block={block} />;
    case 'diagram-ref': {
      const diagramKey = block.diagramId?.trim() ?? '';
      return (
        <DiagramRefView
          block={block}
          diagram={diagramKey ? diagramsById.get(diagramKey) : undefined}
        />
      );
    }
    case 'content-hub-image':
      return <ContentHubImageView block={block} />;
    default:
      return null;
  }
}
