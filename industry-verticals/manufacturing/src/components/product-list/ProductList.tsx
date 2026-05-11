import { useEffect, useState } from 'react';
import { Text, Field, useSitecore } from '@sitecore-content-sdk/nextjs';
import { ComponentProps } from '@/lib/component-props';
import { CONTENT_HUB_CONFIG } from '@/constants/content-hub';

interface ProductListProps extends ComponentProps {
  fields?: {
    Identifier?: Field<string>;
  };
}

type CatalogProduct = {
  identifier: string;
  boosted: boolean;
  productName: string | null;
  categoryNames: string[];
  imageRelativeUrls: string[];
  error?: string;
};

type CatalogResponse = {
  id: string;
  catalogName: string | null;
  products: CatalogProduct[];
};

type CatalogError = {
  error: string;
};

function buildPublicAssetUrl(relativeUrl: string): string {
  const base = CONTENT_HUB_CONFIG.publicContentBaseUrl;
  return `${base.endsWith('/') ? base : `${base}/`}${relativeUrl.replace(/^\//, '')}`;
}

export const Default = ({ fields, params }: ProductListProps) => {
  const { page } = useSitecore();
  const { isEditing } = page.mode;
  const id = params?.RenderingIdentifier;
  const styles = `${params?.styles || ''}`.trim();

  const catalogId = fields?.Identifier?.value?.trim() ?? '';

  const [catalogName, setCatalogName] = useState<string | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!catalogId) {
      setCatalogName(null);
      setProducts([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(
          `${CONTENT_HUB_CONFIG.catalogApiPath}?id=${encodeURIComponent(catalogId)}`,
          { signal: controller.signal }
        );
        const json = (await res.json()) as CatalogResponse | CatalogError;

        if (!res.ok || 'error' in json) {
          const message = 'error' in json ? json.error : `Request failed (${res.status})`;
          setCatalogName(null);
          setProducts([]);
          setError(message);
          return;
        }

        setCatalogName(json.catalogName);
        setProducts(json.products ?? []);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        const message = e instanceof Error ? e.message : 'Unknown error';
        setCatalogName(null);
        setProducts([]);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [catalogId]);

  return (
    <section className={`component product-list py-6 ${styles}`} id={id}>
      <div className="container space-y-6">
        {(fields?.Identifier?.value || isEditing) && (
          <div className="text-foreground-muted text-sm">
            <span className="me-2 font-semibold">Catalog Identifier:</span>
            <Text tag="span" field={fields?.Identifier} />
          </div>
        )}

        {!catalogId && !isEditing && (
          <p className="text-foreground-muted text-sm">No catalog identifier configured.</p>
        )}

        {isLoading && <p className="text-foreground-muted text-sm">Loading catalog…</p>}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!isLoading && !error && catalogId && (
          <>
            <h2 className="text-2xl font-bold">{catalogName ?? 'Unknown catalog'}</h2>

            {products.length === 0 ? (
              <p className="text-foreground-muted text-sm">No products in this catalog.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const imageUrl = product.imageRelativeUrls[0]
                    ? buildPublicAssetUrl(product.imageRelativeUrls[0])
                    : null;
                  const categoryName = product.categoryNames[0] ?? null;
                  const displayName = product.productName ?? product.identifier;

                  return (
                    <li
                      key={product.identifier}
                      className="border-border bg-background flex flex-col overflow-hidden rounded-md border"
                    >
                      <div className="bg-background-muted/40 relative aspect-[4/3] w-full">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt={displayName}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-foreground-muted absolute inset-0 flex items-center justify-center text-xs">
                            No image
                          </div>
                        )}
                        {product.boosted && (
                          <span className="absolute top-2 left-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            Boosted
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 p-4">
                        <h3 className="text-base font-semibold">{displayName}</h3>
                        {categoryName && (
                          <p className="text-foreground-muted text-sm">{categoryName}</p>
                        )}
                        {product.error && <p className="text-xs text-red-600">{product.error}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
};
