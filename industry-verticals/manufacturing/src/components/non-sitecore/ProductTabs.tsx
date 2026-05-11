import { useState } from 'react';
import { useI18n } from 'next-localization';
import { Product } from '@/types/products';
import {
  Text as ContentSdkText,
  RichText as ContentSdkRichText,
  ComponentRendering,
} from '@sitecore-content-sdk/nextjs';
import { ProductReviews } from './ProductReviews';
import { toSafeHtml } from '@/utils/product-data-sheet/richText';

interface ProductTabsProps {
  product: Product;
  isPageEditing: boolean;
  rendering: ComponentRendering;
  /** When true, description comes from Content Hub / datasheet snippet; Sitecore long text and dimensions are not used. */
  useContentHubSource?: boolean;
  /** Raw HTML or plain text from Content Hub (e.g. first datasheet text block); sanitized before render. */
  contentHubDescriptionRaw?: string | null;
}

export const ProductTabs = ({
  product,
  isPageEditing,
  rendering,
  useContentHubSource = false,
  contentHubDescriptionRaw,
}: ProductTabsProps) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'description' | 'dimension' | 'reviews'>(
    'description'
  );

  const tabBase = 'border-b-2 pb-2 transition text-md sm:text-xl';
  const tabActive = 'border-accent text-accent';
  const tabInactive = 'text-foreground-light border-transparent';

  if (useContentHubSource) {
    const html = toSafeHtml(contentHubDescriptionRaw ?? '');
    return (
      <div className="bg-background-muted mt-10 py-6">
        <div className="container flex w-full flex-col items-center">
          <div className="mb-4 flex w-full flex-wrap justify-center gap-4 text-base sm:gap-15 sm:text-xl">
            <button
              type="button"
              className={`${tabBase} ${activeTab === 'description' ? tabActive : tabInactive}`}
              onClick={() => setActiveTab('description')}
            >
              {t('description_tab_label') || 'Description'}
            </button>
            <button
              type="button"
              className={`${tabBase} ${activeTab === 'dimension' ? tabActive : tabInactive}`}
              onClick={() => setActiveTab('dimension')}
            >
              {t('dimensions_tab_label') || 'Additional Information'}
            </button>
            <button
              type="button"
              className={`${tabBase} ${activeTab === 'reviews' ? tabActive : tabInactive}`}
              onClick={() => setActiveTab('reviews')}
            >
              {t('reviews_tab_label') || 'Reviews'}
            </button>
          </div>

          <div className="w-full max-w-6xl px-2 py-2 text-center text-sm sm:px-6 sm:text-base">
            <div className={activeTab === 'description' ? '' : 'hidden'}>
              {html.trim() ? (
                <div
                  className="mx-auto max-w-none text-justify [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : isPageEditing ? (
                <p className="text-foreground-muted">
                  {t('product_ch_no_description_editing') ||
                    'Add a text block to the Content Hub datasheet, or extend the GraphQL product query with a description field.'}
                </p>
              ) : (
                <p className="text-center">
                  {t('no_description_text') || 'No description available'}
                </p>
              )}
            </div>

            <div className={activeTab === 'dimension' ? '' : 'hidden'}>
              <p className="text-foreground-muted max-w-xl px-4 text-center">
                {t('product_ch_dimensions_hint') ||
                  'Physical dimensions are not loaded from Sitecore. Use the technical datasheet on this page for measurements and tables.'}
              </p>
            </div>

            <div className={activeTab === 'reviews' ? '' : 'hidden'}>
              <div className="w-full">
                <div className="container pt-6">
                  <p className="text-foreground-muted pb-6 text-center">
                    {t('product_ch_no_reviews') ||
                      'Reviews are not attached to this Content Hub–backed product view.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-muted mt-10 py-6">
      <div className="container flex w-full flex-col items-center">
        <div className="mb-4 flex w-full flex-wrap justify-center gap-4 text-base sm:gap-15 sm:text-xl">
          <button
            className={`${tabBase} ${activeTab === 'description' ? tabActive : tabInactive}`}
            onClick={() => setActiveTab('description')}
          >
            {t('description_tab_label') || 'Description'}
          </button>
          <button
            className={`${tabBase} ${activeTab === 'dimension' ? tabActive : tabInactive}`}
            onClick={() => setActiveTab('dimension')}
          >
            {t('dimensions_tab_label') || 'Additional Information'}
          </button>
          <button
            className={`${tabBase} ${activeTab === 'reviews' ? tabActive : tabInactive}`}
            onClick={() => setActiveTab('reviews')}
          >
            {t('reviews_tab_label') || 'Reviews'}
          </button>
        </div>

        <div className="w-full max-w-6xl px-2 py-2 text-center text-sm sm:px-6 sm:text-base">
          <div className={activeTab === 'description' ? '' : 'hidden'}>
            {product?.LongDescription?.value || isPageEditing ? (
              <ContentSdkRichText
                field={product.LongDescription}
                className="mx-auto max-w-none text-justify"
              />
            ) : (
              <p className="text-center">
                {t('no_description_text') || 'No description available'}
              </p>
            )}
          </div>

          <div className={activeTab === 'dimension' ? '' : 'hidden'}>
            <div className="flex justify-center">
              <div className="w-full max-w-md px-3 sm:px-8">
                <dl className="text-foreground-light grid grid-cols-2 gap-x-2 gap-y-2 text-left sm:gap-x-4 sm:gap-y-3">
                  {(product?.Width?.value || isPageEditing) && (
                    <>
                      <dt>{t('width_label') || 'Width'}</dt>
                      <dd className="text-right">
                        <ContentSdkText field={product.Width} />
                      </dd>
                    </>
                  )}

                  {(product?.Height?.value || isPageEditing) && (
                    <>
                      <dt>{t('height_label') || 'Height'}</dt>
                      <dd className="text-right">
                        <ContentSdkText field={product.Height} />
                      </dd>
                    </>
                  )}

                  {(product?.Depth?.value || isPageEditing) && (
                    <>
                      <dt>{t('depth_label') || 'Depth'}</dt>
                      <dd className="text-right">
                        <ContentSdkText field={product.Depth} />
                      </dd>
                    </>
                  )}

                  {(product?.Weight?.value || isPageEditing) && (
                    <>
                      <dt>{t('weight_label') || 'Weight'}</dt>
                      <dd className="text-right">
                        <ContentSdkText field={product.Weight} />
                      </dd>
                    </>
                  )}

                  {(product?.SeatHeight?.value || isPageEditing) && (
                    <>
                      <dt>{t('seat_height_label') || 'Seat Height'}</dt>
                      <dd className="text-right">
                        <ContentSdkText field={product.SeatHeight} />
                      </dd>
                    </>
                  )}

                  {(product?.LegHeight?.value || isPageEditing) && (
                    <>
                      <dt>{t('leg_height_label') || 'Leg Height'}</dt>
                      <dd className="text-right">
                        <ContentSdkText field={product.LegHeight} />
                      </dd>
                    </>
                  )}

                  {!(
                    product?.Width?.value ||
                    product?.Height?.value ||
                    product?.Depth?.value ||
                    product?.Weight?.value ||
                    product?.SeatHeight?.value ||
                    product?.LegHeight?.value
                  ) &&
                    !isPageEditing && (
                      <p className="col-span-2 text-center">
                        {t('no_dimensions_text') || 'No dimensions available'}
                      </p>
                    )}
                </dl>
              </div>
            </div>
          </div>

          <div className={activeTab === 'reviews' ? '' : 'hidden'}>
            <ProductReviews reviews={product.Reviews} rendering={rendering} />
          </div>
        </div>
      </div>
    </div>
  );
};
