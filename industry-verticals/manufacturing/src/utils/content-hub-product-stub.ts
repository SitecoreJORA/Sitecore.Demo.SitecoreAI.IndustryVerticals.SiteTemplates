import type { Field, ImageField, RichTextField } from '@sitecore-content-sdk/nextjs';
import type { Category, Product } from '@/types/products';

const emptyText = (value = ''): Field<string> => ({ value });

const emptyRichText = (): RichTextField => ({
  value: '<div class="ck-content"></div>',
});

const PLACEHOLDER_IMAGE = 'https://placehold.co/120x120/e2e8f0/64748b/png?text=%20';

function imageFieldFromUrl(src: string | null | undefined): ImageField {
  const resolved = src?.trim() || PLACEHOLDER_IMAGE;
  return {
    value: {
      src: resolved,
      alt: '',
      width: '1200',
      height: '1200',
    },
  };
}

/**
 * Builds a {@link Product} object for cart / SDK components when only Content Hub data is available.
 * Only the SKU field is expected to come from Sitecore; all display fields are derived from CH.
 */
export function createProductStubFromContentHub(params: {
  sku: string;
  productName: string | null;
  categoryNames: string[];
  galleryImagePublicUrls: string[];
}): Product {
  const title = params.productName?.trim() || params.sku;
  const firstCategory = params.categoryNames[0]?.trim() || '';
  const urls = params.galleryImagePublicUrls;

  const category: Category = {
    id: 'content-hub-category',
    displayName: firstCategory,
    name: firstCategory || 'category',
    url: '',
    fields: {
      CategoryName: emptyText(firstCategory),
    },
  };

  return {
    Title: emptyText(title),
    ShortDescription: emptyText(''),
    LongDescription: emptyRichText(),
    Tags: [],
    Category: category,
    Price: { value: 0 },
    SKU: emptyText(params.sku),
    Color: [],
    Size: [],
    Image1: imageFieldFromUrl(urls[0]),
    Image2: imageFieldFromUrl(urls[1]),
    Image3: imageFieldFromUrl(urls[2]),
    Image4: imageFieldFromUrl(urls[3]),
    Image5: imageFieldFromUrl(urls[4]),
    Width: emptyText(''),
    Height: emptyText(''),
    Depth: emptyText(''),
    Weight: emptyText(''),
    SeatHeight: emptyText(''),
    LegHeight: emptyText(''),
    Reviews: [],
  };
}

