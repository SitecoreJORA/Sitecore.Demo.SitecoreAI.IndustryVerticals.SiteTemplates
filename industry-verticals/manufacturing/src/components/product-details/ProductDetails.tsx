import { Placeholder, useSitecore } from '@sitecore-content-sdk/nextjs';
import { useEffect, useState } from 'react';
import { ComponentProps } from '@/lib/component-props';
import { Heart, Plus } from 'lucide-react';
import { isParamEnabled } from '@/helpers/isParamEnabled';
import { useI18n } from 'next-localization';
import { Product } from '@/types/products';
import { ProductTabs } from '../non-sitecore/ProductTabs';
import QuantityControl from '../non-sitecore/QuantityControl';
import { AddToCartButton } from '../non-sitecore/AddToCartButton';
import { ProductGallery } from '../non-sitecore/ProductGallery';
import { ProductMetaDetals } from '../non-sitecore/ProductMetaDetails';
import { ProductDescription } from '../non-sitecore/ProductDescription';
import { ProductSizeControl } from '../non-sitecore/ProductSizeControl';
import { ProductColorControl } from '../non-sitecore/ProductColorControl';
import { CONTENT_HUB_CONFIG } from '@/constants/content-hub';

interface ProductDetailsProps extends ComponentProps {
  params: { [key: string]: string };
  fields: Product;
}

export const Default = (props: ProductDetailsProps) => {
  const { page } = useSitecore();
  const { t } = useI18n();

  const id = props?.params?.RenderingIdentifier;
  const styles = `${props?.params?.styles || ''}`.trim();
  const isPageEditing = page.mode.isEditing;

  const product = props?.fields;
  const productId = page.layout.sitecore.route?.itemId;
  const sku = product?.SKU?.value?.trim();

  const ShowCompareButton = isParamEnabled(props?.params?.ShowCompareButton);
  const ShowAddtoCartButton = isParamEnabled(props?.params?.ShowAddtoCartButton);
  const ShowAddtoWishlistButton = isParamEnabled(props?.params?.ShowAddtoWishlistButton);

  const relatedProductsPlaceholderKey = `related-products-${props?.params?.DynamicPlaceholderId}`;

  const [selectedColor, setSelectedColor] = useState(product?.Color?.[0]);
  const [selectedSize, setSelectedSize] = useState(product?.Size?.[0]);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [productDataSheet, setProductDataSheet] = useState<string | null>(null);
  const [productDataSheetError, setProductDataSheetError] = useState<string | null>(null);
  const [isLoadingProductDataSheet, setIsLoadingProductDataSheet] = useState(false);

  useEffect(() => {
    setSelectedColor(product?.Color?.[0]);
    setSelectedSize(product?.Size?.[0]);
    setSelectedQuantity(1);
  }, [product?.Color, product?.Size, productId]);

  useEffect(() => {
    if (!sku) {
      setProductDataSheet(null);
      setProductDataSheetError(null);
      setIsLoadingProductDataSheet(false);
      return;
    }

    const controller = new AbortController();

    async function load() {
      try {
        setIsLoadingProductDataSheet(true);
        setProductDataSheetError(null);

        const res = await fetch(
          `${CONTENT_HUB_CONFIG.productDatasheetApiPath}?id=${encodeURIComponent(sku)}`,
          { signal: controller.signal }
        );
        const json = (await res.json()) as
          | { id: string; sCHOTT_ProductDataSheet: string | null }
          | { error: string };

        if (!res.ok) {
          const message = 'error' in json ? json.error : `Request failed (${res.status})`;
          setProductDataSheet(null);
          setProductDataSheetError(message);
          return;
        }

        if (!('sCHOTT_ProductDataSheet' in json)) {
          setProductDataSheet(null);
          setProductDataSheetError('Unexpected response from server.');
          return;
        }

        setProductDataSheet(json.sCHOTT_ProductDataSheet ?? null);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        const message = e instanceof Error ? e.message : 'Unknown error';
        setProductDataSheet(null);
        setProductDataSheetError(message);
      } finally {
        setIsLoadingProductDataSheet(false);
      }
    }

    load();

    return () => controller.abort();
  }, [sku]);

  if (!props.fields?.Title) {
    return isPageEditing ? (
      <div className={`component article-listing py-6 ${styles}`} id={id}>
        [Product Details]
      </div>
    ) : (
      <></>
    );
  }

  return (
    <section className={`component article-listing py-6 ${styles}`} id={id}>
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left image section */}
          <ProductGallery product={product} key={productId} />

          {/* Right product info */}
          <div className="max-w-xl space-y-4 pb-4 lg:px-10">
            <ProductDescription product={product} />

            <div className="flex flex-wrap justify-between gap-4 py-5">
              {/* Sizes */}
              {!!product?.Size?.length && (
                <div>
                  <p className="mb-2 text-sm">{t('product_size_label') || 'Size'}</p>
                  <ProductSizeControl
                    sizes={product.Size}
                    selectedSize={selectedSize}
                    onSelect={setSelectedSize}
                  />
                </div>
              )}

              {/* Colors */}
              {!!product?.Color?.length && (
                <div>
                  <p className="mb-2 text-sm">{t('product_color_label') || 'Color'}</p>
                  <ProductColorControl
                    colors={product.Color}
                    selectedColor={selectedColor}
                    onSelect={setSelectedColor}
                  />
                </div>
              )}

              {/* Quantity */}
              <div>
                <p className="mb-2 text-sm">{t('product_quantity_label') || 'Quantity'}</p>
                <QuantityControl
                  quantity={selectedQuantity}
                  onChange={setSelectedQuantity}
                  isLarge
                />
              </div>
            </div>

            {/* Add to cart */}
            {ShowAddtoCartButton && (
              <AddToCartButton
                productId={productId || ''}
                product={product}
                selectedQuantity={selectedQuantity}
                selectedColor={selectedColor}
                selectedSize={selectedSize}
              />
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              {ShowCompareButton && (
                <button className="action-btn">
                  <Plus className="size-5" strokeWidth={3} />
                  {t('compare_btn_text') || 'Compare'}
                </button>
              )}

              {ShowAddtoWishlistButton && (
                <button className="action-btn">
                  <Heart className="size-5" strokeWidth={3} />
                  {t('wishlist_btn_text') || 'Add to Wishlist'}
                </button>
              )}
            </div>
          </div>

          <ProductMetaDetals product={product} />
        </div>
      </div>

      <ProductTabs
        product={product}
        isPageEditing={isPageEditing}
        dynamicPlaceholderId={props.params.DynamicPlaceholderId}
        rendering={props.rendering}
      />

      <div className="container mt-8">
        <h3 className="text-xl font-bold">sCHOTT_ProductDataSheet</h3>
        {!sku && (
          <p className="text-foreground-muted mt-2 text-sm">No SKU found on this product.</p>
        )}
        {isLoadingProductDataSheet && (
          <p className="text-foreground-muted mt-2 text-sm">Loading…</p>
        )}
        {productDataSheetError && (
          <p className="mt-2 text-sm text-red-600">{productDataSheetError}</p>
        )}

        {!isLoadingProductDataSheet && !productDataSheetError && sku && (
          <pre className="bg-muted mt-4 max-h-[520px] overflow-auto rounded-lg p-4 text-xs leading-5 break-words whitespace-pre-wrap">
            {(() => {
              if (!productDataSheet) return 'No data returned.';
              try {
                const parsed = JSON.parse(productDataSheet) as unknown;
                return JSON.stringify(parsed, null, 2);
              } catch {
                return productDataSheet;
              }
            })()}
          </pre>
        )}
      </div>

      <Placeholder name={relatedProductsPlaceholderKey} rendering={props.rendering} />
    </section>
  );
};
