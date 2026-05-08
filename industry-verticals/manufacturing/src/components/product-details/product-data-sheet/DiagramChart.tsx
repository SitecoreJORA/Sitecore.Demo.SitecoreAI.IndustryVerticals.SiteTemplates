import React, { useEffect, useRef } from 'react';
import { Chart, registerables, type Plugin } from 'chart.js';
import type { Annotation, Diagram } from '@/types/product-data-sheet';

Chart.register(...registerables);

const SERIES_COLORS = [
  '#2E75B6',
  '#E74C3C',
  '#2ECC71',
  '#F39C12',
  '#9B59B6',
  '#1ABC9C',
  '#E67E22',
  '#3498DB',
  '#E91E63',
  '#00BCD4',
];

function makeInlineAnnotationPlugin(annotations: Annotation[]): Plugin<'line' | 'scatter'> {
  return {
    id: 'datasheet-inline-annotations',
    afterDatasetsDraw(chart) {
      const inside = annotations.filter((a) => a.display === 'inside');
      if (inside.length === 0) return;
      const { ctx, chartArea, scales } = chart;
      const xScale = scales.x;
      const yScale = scales.y;
      if (!xScale || !yScale) return;

      ctx.save();
      ctx.font = '11px sans-serif';
      ctx.textBaseline = 'alphabetic';

      inside.forEach((a) => {
        const px = xScale.getPixelForValue(a.x);
        const py = yScale.getPixelForValue(a.y);
        if (
          px < chartArea.left ||
          px > chartArea.right ||
          py < chartArea.top ||
          py > chartArea.bottom
        ) {
          return;
        }

        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        const lines = String(a.label || '')
          .split(/\r?\n/)
          .filter(Boolean);
        if (lines.length === 0) return;

        const lineHeight = 13;
        const padding = 4;
        const widths = lines.map((l) => ctx.measureText(l).width);
        const boxWidth = Math.max(...widths) + padding * 2;
        const boxHeight = lines.length * lineHeight + padding * 2;

        let bx = px + 8;
        let by = py - boxHeight - 8;

        if (bx + boxWidth > chartArea.right) bx = px - boxWidth - 8;
        if (by < chartArea.top) by = py + 8;
        if (bx < chartArea.left) bx = chartArea.left + 2;
        if (by + boxHeight > chartArea.bottom) by = chartArea.bottom - boxHeight - 2;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(bx + boxWidth / 2, by + boxHeight / 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(bx, by, boxWidth, boxHeight);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#222';
        ctx.textAlign = 'left';
        lines.forEach((line, li) => {
          ctx.fillText(line, bx + padding, by + padding + lineHeight * (li + 1) - 3);
        });
      });

      ctx.restore();
    },
  };
}

export interface DiagramChartProps {
  diagram: Diagram;
}

/**
 * Canvas chart for datasheet diagram definitions (client-only; load via `next/dynamic` with `ssr: false`).
 */
export default function DiagramChart({ diagram }: DiagramChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const datasets = diagram.series.map((s, i) => ({
      label: s.name,
      data: s.data.map(([x, y]) => ({ x, y })),
      borderColor: s.color || SERIES_COLORS[i % SERIES_COLORS.length],
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: diagram.chartType === 'scatter' ? 3 : 1,
      tension: 0.1,
    }));

    const inlinePlugin = makeInlineAnnotationPlugin(diagram.annotations || []);

    chartRef.current = new Chart(canvasRef.current, {
      type: diagram.chartType === 'scatter' ? 'scatter' : 'line',
      data: { datasets },
      plugins: [inlinePlugin],
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.6,
        plugins: {
          legend: { position: 'bottom' },
          title: {
            display: !!diagram.title,
            text: diagram.title,
            font: { size: 14 },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: !!diagram.xAxis.label,
              text: diagram.xAxis.unit
                ? `${diagram.xAxis.label} [${diagram.xAxis.unit}]`
                : diagram.xAxis.label,
            },
          },
          y: {
            title: {
              display: !!diagram.yAxis.label,
              text: diagram.yAxis.unit
                ? `${diagram.yAxis.label} [${diagram.yAxis.unit}]`
                : diagram.yAxis.label,
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [diagram]);

  const belowAnnotations = (diagram.annotations || []).filter(
    (a) => (a.display || 'below') === 'below'
  );

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="max-h-[420px] w-full" />
      {belowAnnotations.length > 0 && (
        <div className="text-foreground-muted mt-3 flex flex-wrap gap-2 text-xs">
          {belowAnnotations.map((a, i) => (
            <span key={i} className="bg-muted rounded px-2 py-1">
              {a.label} ({a.x}, {a.y})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
