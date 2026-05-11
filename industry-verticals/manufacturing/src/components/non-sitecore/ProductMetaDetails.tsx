import { Text as ContentSdkText, useSitecore } from '@sitecore-content-sdk/nextjs';
import { useEffect, useState } from 'react';
import SocialShare from './SocialShare';
import { useI18n } from 'next-localization';
import { Product } from '@/types/products';

interface ProductMetaDetalsProps {
  product: Product;
  /**
   * When `contentHub`, category and share title come from Content Hub props;
   * Sitecore category/tags are not shown. SKU still uses the Sitecore field component.
   */
  contentSource?: 'sitecore' | 'contentHub';
  contentHubCategoryNames?: string[];
  contentHubShareTitle?: string;
}

export const ProductMetaDetals = ({
  product,
  contentSource = 'sitecore',
  contentHubCategoryNames,
  contentHubShareTitle,
}: ProductMetaDetalsProps) => {
  const { page } = useSitecore();
  const { t } = useI18n();

  const isPageEditing = page.mode.isEditing;

  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, [product]);

  const isContentHub = contentSource === 'contentHub';
  const categoryLine =
    isContentHub && contentHubCategoryNames?.length
      ? contentHubCategoryNames.join(', ')
      : !isContentHub && product.Category?.fields?.CategoryName?.value
        ? product.Category.fields.CategoryName.value
        : null;

  const shareTitle =
    isContentHub && contentHubShareTitle?.trim()
      ? contentHubShareTitle.trim()
      : product.Title?.value ?? '';

  return (
    <>
      <div className="text-foreground-light mx-0 border-t pt-10 text-sm sm:pb-6 lg:col-start-2 lg:mx-10">
        <dl className="grid grid-cols-[auto_16px_1fr] gap-x-2 gap-y-4">
          {(product?.SKU?.value || isPageEditing) && (
            <>
              <dt>{t('product_sku_label') || 'SKU'}</dt>
              <dd className="text-center">:</dd>
              <dd>
                <ContentSdkText field={product.SKU} />
              </dd>
            </>
          )}

          {categoryLine && (
            <>
              <dt>{t('product_category_label') || 'Category'}</dt>
              <dd className="text-center">:</dd>
              <dd>{categoryLine}</dd>
            </>
          )}

          {!isContentHub &&
            Array.isArray(product?.Tags) &&
            product.Tags.length > 0 && (
              <>
                <dt>{t('product_tags_label') || 'Tags'}</dt>
                <dd className="text-center">:</dd>
                <dd>{product.Tags.map((tag) => tag.fields.Tag.value).join(', ')}</dd>
              </>
            )}

          <dt className="flex items-center">{t('product_share_label') || 'Share'}</dt>
          <dd className="flex items-center justify-center">:</dd>
          <dd className="mr-1">
            <SocialShare
              url={currentUrl}
              title={shareTitle}
              round={true}
              className="flex flex-wrap gap-3"
              iconClassName="size-8"
            />
          </dd>
        </dl>
      </div>
    </>
  );
};
