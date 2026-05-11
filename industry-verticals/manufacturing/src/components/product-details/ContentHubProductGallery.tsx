import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/shadcn/lib/utils';

export interface ContentHubProductGalleryProps {
  imageUrls: string[];
  productName: string;
  /** Prefer this URL as the initially selected main image when it appears in `imageUrls`. */
  preferredMainUrl?: string | null;
}

/**
 * Product image gallery using Content Hub public asset URLs only (no Sitecore image fields).
 */
export function ContentHubProductGallery({
  imageUrls,
  productName,
  preferredMainUrl,
}: ContentHubProductGalleryProps) {
  const urls = useMemo(() => imageUrls.filter((u) => u?.trim()), [imageUrls]);

  const initialIndex = useMemo(() => {
    if (urls.length === 0) return 0;
    const pref = preferredMainUrl?.trim();
    if (pref) {
      const idx = urls.indexOf(pref);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [urls, preferredMainUrl]);

  const [mainIndex, setMainIndex] = useState(initialIndex);

  useEffect(() => {
    setMainIndex(initialIndex);
  }, [initialIndex, urls]);

  if (urls.length === 0) {
    return (
      <div className="bg-background-muted/40 border-border text-foreground-muted flex aspect-square w-full items-center justify-center rounded-lg border border-dashed sm:aspect-[4/3]">
        <p className="px-4 text-center text-sm">No product images returned from Content Hub.</p>
      </div>
    );
  }

  const mainSrc = urls[mainIndex] ?? urls[0];

  return (
    <div className="flex w-full flex-col-reverse gap-3 sm:flex-row">
      {urls.length > 1 && (
        <div className="flex gap-3 sm:flex-col sm:justify-start">
          {urls.map((src, idx) => {
            const isActive = idx === mainIndex;
            return (
              <button
                key={src}
                type="button"
                onClick={() => setMainIndex(idx)}
                disabled={isActive}
                aria-label={`View image ${idx + 1}`}
                className={cn(
                  'border-border bg-background-muted focus:ring-accent size-15 overflow-hidden rounded border focus:ring-2 focus:outline-none xl:size-18',
                  isActive ? 'cursor-not-allowed opacity-50' : 'hover:ring-accent hover:ring-2'
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="size-full object-cover" loading="lazy" />
              </button>
            );
          })}
        </div>
      )}

      <div className="grow">
        <div className="bg-background-muted/40 border-border overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainSrc}
            alt={productName}
            className="aspect-square w-full object-contain p-4 sm:aspect-[4/3]"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
}
