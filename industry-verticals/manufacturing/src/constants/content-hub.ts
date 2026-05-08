/**
 * Content Hub configuration from environment variables (Sitecore Deploy / `.env.local`).
 * Same pattern as `SEARCH_CONFIG` in `SearchResultsComponent.tsx`: read `process.env` at module scope.
 *
 * `CH_*` variables are server-only (available in API routes / SSR). They are not prefixed with
 * `NEXT_PUBLIC_` so they are never exposed to the browser bundle.
 *
 * Optional `NEXT_PUBLIC_CONTENT_HUB_*` overrides are available for URLs/paths needed by client components.
 */
const DEFAULT_GRAPHQL_PREVIEW_URL =
  'https://almu-schott.sitecoresandbox.cloud/api/graphql/preview/v1';

export const CONTENT_HUB_CONFIG = {
  adminUser: process.env.CH_ADMIN_USER as string,
  adminPw: process.env.CH_ADMIN_PW as string,
  previewToken: process.env.CH_PREVIEW_TOKEN as string,
  graphqlPreviewUrl:
    (process.env.NEXT_PUBLIC_CONTENT_HUB_GRAPHQL_PREVIEW_URL as string | undefined) ??
    DEFAULT_GRAPHQL_PREVIEW_URL,
  productDatasheetApiPath:
    (process.env.NEXT_PUBLIC_CONTENT_HUB_PRODUCT_DATASHEET_API as string | undefined) ??
    '/api/content-hub/product-datasheet',
} as const;
