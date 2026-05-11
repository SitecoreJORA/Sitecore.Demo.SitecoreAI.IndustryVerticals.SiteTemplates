import { Placeholder, Text as ContentSdkText, useSitecore } from '@sitecore-content-sdk/nextjs';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { ComponentProps } from '@/lib/component-props';
import { Heart, Plus } from 'lucide-react';
import { isParamEnabled } from '@/helpers/isParamEnabled';
import { useI18n } from 'next-localization';
import { Product } from '@/types/products';
import { ProductTabs } from '../non-sitecore/ProductTabs';
import QuantityControl from '../non-sitecore/QuantityControl';
import { AddToCartButton } from '../non-sitecore/AddToCartButton';
import { ProductMetaDetals } from '../non-sitecore/ProductMetaDetails';
import { CONTENT_HUB_CONFIG } from '@/constants/content-hub';
import { ProductDataSheetView } from './product-data-sheet/ProductDataSheetView';
import {
  extractFirstTextBlockFromDataSheetJson,
  parseDataSheetJson,
  parseDiagramDataJson,
} from './product-data-sheet/parsers';
import { ContentHubProductGallery } from './ContentHubProductGallery';
import { createProductStubFromContentHub } from '@/utils/content-hub-product-stub';

type ContentHubProductPayload = {
  productName: string | null;
  productCategoryNames: string[];
  masterImagePublicUrl: string | null;
  galleryImagePublicUrls: string[];
};

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

  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [productDataSheet, setProductDataSheet] = useState<string | null>(null);
  const [productDiagramData, setProductDiagramData] = useState<string | null>(null);
  const [productDataSheetError, setProductDataSheetError] = useState<string | null>(null);
  const [isLoadingProductDataSheet, setIsLoadingProductDataSheet] = useState(false);
  const [contentHubProduct, setContentHubProduct] = useState<ContentHubProductPayload | null>(
    null
  );

  const parsedDataSheet = useMemo(() => parseDataSheetJson(productDataSheet), [productDataSheet]);
  const parsedDiagramData = useMemo(
    () => parseDiagramDataJson(productDiagramData),
    [productDiagramData]
  );

  const contentHubDescriptionSnippet = useMemo(
    () => extractFirstTextBlockFromDataSheetJson(productDataSheet),
    [productDataSheet]
  );

  const cartProductStub = useMemo(() => {
    if (!sku || !contentHubProduct) return null;
    return createProductStubFromContentHub({
      sku,
      productName: contentHubProduct.productName,
      categoryNames: contentHubProduct.productCategoryNames,
      galleryImagePublicUrls: contentHubProduct.galleryImagePublicUrls,
    });
  }, [sku, contentHubProduct]);

  useEffect(() => {
    setSelectedQuantity(1);
  }, [productId, sku]);

  useEffect(() => {
    if (!sku) {
      setProductDataSheet(null);
      setProductDiagramData(null);
      setContentHubProduct(null);
      setProductDataSheetError(null);
      setIsLoadingProductDataSheet(false);
      return;
    }

    const controller = new AbortController();

    async function load() {
      try {
        setIsLoadingProductDataSheet(true);
        setProductDataSheetError(null);
        setContentHubProduct(null);

        const res = await fetch(
          `${CONTENT_HUB_CONFIG.productDatasheetApiPath}?id=${encodeURIComponent(sku)}`,
          { signal: controller.signal }
        );
        const json = (await res.json()) as
          | {
              id: string;
              sCHOTT_ProductDataSheet: string | null;
              sCHOTT_DiagramData?: string | null;
              productName?: string | null;
              productCategoryNames?: string[];
              masterImagePublicUrl?: string | null;
              galleryImagePublicUrls?: string[];
            }
          | { error: string };

        if (!res.ok) {
          const message = 'error' in json ? json.error : `Request failed (${res.status})`;
          setProductDataSheet(null);
          setProductDiagramData(null);
          setContentHubProduct(null);
          setProductDataSheetError(message);
          return;
        }

        if (!('sCHOTT_ProductDataSheet' in json)) {
          setProductDataSheet(null);
          setProductDiagramData(null);
          setContentHubProduct(null);
          setProductDataSheetError('Unexpected response from server.');
          return;
        }

        startTransition(() => {
          setProductDataSheet(json.sCHOTT_ProductDataSheet ?? null);
          setProductDiagramData(json.sCHOTT_DiagramData ?? null);
          setContentHubProduct({
            productName: json.productName?.trim() || null,
            productCategoryNames: Array.isArray(json.productCategoryNames)
              ? json.productCategoryNames
              : [],
            masterImagePublicUrl: json.masterImagePublicUrl?.trim() || null,
            galleryImagePublicUrls: Array.isArray(json.galleryImagePublicUrls)
              ? json.galleryImagePublicUrls
              : [],
          });
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        const message = e instanceof Error ? e.message : 'Unknown error';
        setProductDataSheet(null);
        setProductDiagramData(null);
        setContentHubProduct(null);
        setProductDataSheetError(message);
      } finally {
        setIsLoadingProductDataSheet(false);
      }
    }

    load();

    return () => controller.abort();
  }, [sku]);

  if (!sku) {
    return isPageEditing ? (
      <div className={`component article-listing py-6 ${styles}`} id={id}>
        [Product Details — assign SKU on this item to load Content Hub product data]
      </div>
    ) : (
      <></>
    );
  }

  const displayTitle =
    contentHubProduct?.productName?.trim() ||
    (isLoadingProductDataSheet ? (t('product_ch_loading_title') || 'Loading…') : sku);

  return (
    <section className={`component article-listing py-6 ${styles}`} id={id}>
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="w-full">
            <ContentHubProductGallery
              imageUrls={contentHubProduct?.galleryImagePublicUrls ?? []}
              preferredMainUrl={contentHubProduct?.masterImagePublicUrl}
              productName={displayTitle}
            />
          </div>

          <div className="max-w-xl space-y-4 pb-4 lg:px-10">
            <div>
              <h1 className="pt-3 text-4xl font-bold lg:pt-0">{displayTitle}</h1>
              {isPageEditing && (
                <p className="text-foreground-muted mt-2 text-xs">
                  {t('product_ch_sku_source_hint') || 'SKU from Sitecore:'}{' '}
                  <ContentSdkText field={product.SKU} tag="span" />
                </p>
              )}
              {!!contentHubProduct?.productCategoryNames?.length && (
                <p className="text-foreground-muted mt-2 text-sm">
                  {contentHubProduct.productCategoryNames.join(' · ')}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-between gap-4 py-5">
              <div>
                <p className="mb-2 text-sm">{t('product_quantity_label') || 'Quantity'}</p>
                <QuantityControl
                  quantity={selectedQuantity}
                  onChange={setSelectedQuantity}
                  isLarge
                />
              </div>
            </div>

            {ShowAddtoCartButton && cartProductStub && (
              <AddToCartButton
                productId={productId || ''}
                product={cartProductStub}
                selectedQuantity={selectedQuantity}
              />
            )}

            <div className="flex flex-wrap gap-x-10 gap-y-4">
              {ShowCompareButton && (
                <button type="button" className="action-btn">
                  <Plus className="size-5" strokeWidth={3} />
                  {t('compare_btn_text') || 'Compare'}
                </button>
              )}

              {ShowAddtoWishlistButton && (
                <button type="button" className="action-btn">
                  <Heart className="size-5" strokeWidth={3} />
                  {t('wishlist_btn_text') || 'Add to Wishlist'}
                </button>
              )}
            </div>
          </div>

          <ProductMetaDetals
            product={product}
            contentSource="contentHub"
            contentHubCategoryNames={contentHubProduct?.productCategoryNames}
            contentHubShareTitle={contentHubProduct?.productName?.trim() || sku}
          />
        </div>
      </div>

      <ProductTabs
        product={cartProductStub ?? product}
        isPageEditing={isPageEditing}
        rendering={props.rendering}
        useContentHubSource
        contentHubDescriptionRaw={contentHubDescriptionSnippet}
      />

      <div className="container mt-8">
        <h3 className="text-xl font-bold">
          {t('product_datasheet_heading') || 'Technical datasheet'}
        </h3>
        {isLoadingProductDataSheet && (
          <p className="text-foreground-muted mt-2 text-sm">Loading…</p>
        )}
        {productDataSheetError && (
          <p className="mt-2 text-sm text-red-600">{productDataSheetError}</p>
        )}

        {!isLoadingProductDataSheet && !productDataSheetError && sku && (
          <div className="mt-6">
            {!productDataSheet && (
              <p className="text-foreground-muted text-sm">No datasheet returned for this SKU.</p>
            )}
            {productDataSheet && !parsedDataSheet && (
              <p className="text-sm text-amber-700">
                The datasheet payload could not be parsed as valid JSON.
              </p>
            )}
            {parsedDataSheet && (
              <div className="border-border bg-background-muted/40 rounded-xl border p-6 sm:p-8">
                <ProductDataSheetView document={parsedDataSheet} diagramData={parsedDiagramData} />
              </div>
            )}
          </div>
        )}
      </div>

      <Placeholder name={relatedProductsPlaceholderKey} rendering={props.rendering} />
    </section>
  );
};
