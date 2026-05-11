import { Text as ContentSdkText, useSitecore } from '@sitecore-content-sdk/nextjs';
import { Product } from '@/types/products';
import StarRating from './StarRating';
import { useLocale } from '@/hooks/useLocaleOptions';
import { calculateAverageRating } from '@/helpers/productUtils';

interface ProductDescriptionProps {
  product: Product;
  /** When set (e.g. from Content Hub PCM), replaces the Sitecore `Title` in the main headline. */
  contentHubProductName?: string | null;
  /** Category labels from Content Hub `categoryToProduct` (shown under the headline). */
  contentHubCategoryNames?: string[] | null;
}

export const ProductDescription = ({
  product,
  contentHubProductName,
  contentHubCategoryNames,
}: ProductDescriptionProps) => {
  const { page } = useSitecore();
  const isPageEditing = page.mode.isEditing;
  const { currency } = useLocale();

  const reviews = product?.Reviews || [];
  const reviewCount = reviews.length;
  const averageRating = calculateAverageRating(reviews);

  const hubName = contentHubProductName?.trim();
  const hubCategories = contentHubCategoryNames?.map((c) => c.trim()).filter(Boolean) ?? [];

  return (
    <>
      <h1 className="pt-3 text-4xl font-bold lg:pt-0">
        {isPageEditing ? (
          <ContentSdkText field={product.Title} />
        ) : hubName ? (
          <span>{hubName}</span>
        ) : (
          <ContentSdkText field={product.Title} />
        )}
      </h1>
      {isPageEditing && hubName && (
        <div className="text-foreground-muted mt-1 text-xs">
          Content Hub name: <span className="text-foreground font-medium">{hubName}</span>
        </div>
      )}
      {hubCategories.length > 0 && (
        <p className="text-foreground-muted mt-2 text-sm">{hubCategories.join(' · ')}</p>
      )}

      {(product?.Price?.value || isPageEditing) && (
        <p className="text-xl">
          {currency} <ContentSdkText field={product.Price} />
        </p>
      )}

      {!!product?.Reviews?.length && (
        <div className="flex items-center space-x-3">
          <span className="text-foreground text-lg">{averageRating}</span>
          <StarRating rating={averageRating} className="!text-accent" />
          <div className="bg-foreground-muted h-7 w-px" />
          <span className="text-foreground-muted text-sm">
            {reviewCount} Customer Review{reviewCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {(product?.ShortDescription?.value || isPageEditing) && (
        <div className="text-foreground text-lg">
          <ContentSdkText field={product.ShortDescription} />
        </div>
      )}
    </>
  );
};
