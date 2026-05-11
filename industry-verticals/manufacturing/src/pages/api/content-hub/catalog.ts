import type { NextApiRequest, NextApiResponse } from 'next';
import { CONTENT_HUB_CONFIG } from '@/constants/content-hub';

export type CatalogProductOrderEntry = {
  id: number;
  identifier: string;
  boosted: boolean;
};

export type CatalogProductOrder = {
  products: CatalogProductOrderEntry[];
};

export type CatalogProduct = {
  identifier: string;
  boosted: boolean;
  productName: string | null;
  categoryNames: string[];
  /** Public-content relative URLs (combine with `CONTENT_HUB_CONFIG.publicContentBaseUrl`). */
  imageRelativeUrls: string[];
  /** Populated when the per-product GraphQL lookup fails; product still appears in the list. */
  error?: string;
};

type SuccessResponse = {
  id: string;
  catalogName: string | null;
  productOrder: CatalogProductOrder | null;
  products: CatalogProduct[];
};

type ErrorResponse = {
  error: string;
};

function padBase64(value: string): string {
  const trimmed = value.trim();
  const remainder = trimmed.length % 4;
  if (remainder === 0) return trimmed;
  return trimmed + '='.repeat(4 - remainder);
}

function getAuthHeaders(): Record<string, string> {
  const previewToken = CONTENT_HUB_CONFIG.previewToken?.trim();

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
  };

  if (previewToken) {
    headers['X-GQL-Token'] = padBase64(previewToken);
  }

  return headers;
}

/**
 * Content Hub may expose `productOrderJson` either as a JSON scalar (object) or
 * as a serialized string. Normalize to a typed object or `null` if unparseable.
 */
function normalizeProductOrder(value: unknown): CatalogProductOrder | null {
  if (value == null) return null;
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const products = (parsed as { products?: unknown }).products;
  if (!Array.isArray(products)) return null;
  return {
    products: products
      .filter((p): p is { id: number; identifier: string; boosted: boolean } => {
        return (
          !!p &&
          typeof p === 'object' &&
          typeof (p as { id?: unknown }).id === 'number' &&
          typeof (p as { identifier?: unknown }).identifier === 'string' &&
          typeof (p as { boosted?: unknown }).boosted === 'boolean'
        );
      })
      .map((p) => ({ id: p.id, identifier: p.identifier, boosted: p.boosted })),
  };
}

type GraphQlPayload<TData> = {
  data?: TData | null;
  errors?: Array<{ message?: string }>;
};

type CatalogPayload = {
  m_PCM_Catalog?: {
    catalogName?: string | null;
    productOrderJson?: unknown;
  } | null;
};

type ProductPayload = {
  m_PCM_Product?: {
    productName?: string | null;
    categoryToProduct?: {
      results?: Array<{ productCategoryName?: string | null } | null> | null;
    } | null;
    pCMProductToMasterAsset?: {
      results?: Array<{
        assetToPublicLink?: {
          results?: Array<{ relativeUrl?: string | null } | null> | null;
        } | null;
      } | null> | null;
    } | null;
  } | null;
};

async function postContentHubGraphql<TData>(
  query: string,
  variables: Record<string, unknown>
): Promise<{ response: Response; raw: string; json: GraphQlPayload<TData> | null }> {
  const response = await fetch(CONTENT_HUB_CONFIG.graphqlPreviewUrl, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ query, variables }),
  });
  const raw = await response.text();
  let json: GraphQlPayload<TData> | null = null;
  try {
    json = JSON.parse(raw) as GraphQlPayload<TData>;
  } catch {
    json = null;
  }
  return { response, raw, json };
}

const QUERY_CATALOG = /* GraphQL */ `
  query Catalog($id: String!) {
    m_PCM_Catalog(id: $id) {
      catalogName
      productOrderJson
    }
  }
`;

const QUERY_PRODUCT = /* GraphQL */ `
  query Product($id: String!) {
    m_PCM_Product(id: $id) {
      productName
      categoryToProduct {
        results {
          productCategoryName
        }
      }
      pCMProductToMasterAsset {
        total
        results {
          assetToPublicLink {
            total
            results {
              relativeUrl
            }
          }
        }
      }
    }
  }
`;

function collectCategoryNames(payload: ProductPayload['m_PCM_Product']): string[] {
  const results = payload?.categoryToProduct?.results ?? [];
  return results
    .map((r) => r?.productCategoryName)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
}

function collectImageRelativeUrls(payload: ProductPayload['m_PCM_Product']): string[] {
  const assets = payload?.pCMProductToMasterAsset?.results ?? [];
  const urls: string[] = [];
  for (const asset of assets) {
    const links = asset?.assetToPublicLink?.results ?? [];
    for (const link of links) {
      const url = link?.relativeUrl;
      if (typeof url === 'string' && url.length > 0) {
        urls.push(url);
      }
    }
  }
  return urls;
}

async function fetchProduct(entry: CatalogProductOrderEntry): Promise<CatalogProduct> {
  try {
    const { response, json } = await postContentHubGraphql<ProductPayload>(QUERY_PRODUCT, {
      id: entry.identifier,
    });

    if (!response.ok || !json) {
      return {
        identifier: entry.identifier,
        boosted: entry.boosted,
        productName: null,
        categoryNames: [],
        imageRelativeUrls: [],
        error: `Request failed (${response.status})`,
      };
    }

    if (json.errors?.length) {
      const message =
        json.errors
          .map((e) => e?.message)
          .filter(Boolean)
          .join('; ') || 'GraphQL error';
      return {
        identifier: entry.identifier,
        boosted: entry.boosted,
        productName: null,
        categoryNames: [],
        imageRelativeUrls: [],
        error: message,
      };
    }

    const product = json.data?.m_PCM_Product ?? null;
    return {
      identifier: entry.identifier,
      boosted: entry.boosted,
      productName: product?.productName ?? null,
      categoryNames: collectCategoryNames(product),
      imageRelativeUrls: collectImageRelativeUrls(product),
    };
  } catch (e) {
    return {
      identifier: entry.identifier,
      boosted: entry.boosted,
      productName: null,
      categoryNames: [],
      imageRelativeUrls: [],
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const idParam = req.query.id;
  const id = typeof idParam === 'string' ? idParam.trim() : '';

  if (!id) {
    return res.status(400).json({ error: 'Missing required query parameter: id' });
  }

  try {
    const { response, raw, json } = await postContentHubGraphql<CatalogPayload>(QUERY_CATALOG, {
      id,
    });
    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      const messageFromGraphql = json?.errors
        ?.map((e) => e?.message)
        .filter(Boolean)
        .join('; ');
      const snippet = raw.slice(0, 280).replace(/\s+/g, ' ').trim();
      const message =
        messageFromGraphql ||
        `Content Hub request failed (${response.status}). content-type="${contentType}". body="${snippet}"`;
      return res.status(response.status).json({ error: message });
    }

    if (!json) {
      const snippet = raw.slice(0, 280).replace(/\s+/g, ' ').trim();
      return res.status(502).json({
        error: `Content Hub returned non-JSON response. content-type="${contentType}". body="${snippet}"`,
      });
    }

    if (json.errors?.length) {
      const message =
        json.errors
          .map((e) => e?.message)
          .filter(Boolean)
          .join('; ') || 'GraphQL error';
      return res.status(502).json({ error: message });
    }

    const catalog = json.data?.m_PCM_Catalog ?? null;
    const productOrder = normalizeProductOrder(catalog?.productOrderJson);

    const products = productOrder ? await Promise.all(productOrder.products.map(fetchProduct)) : [];

    return res.status(200).json({
      id,
      catalogName: catalog?.catalogName ?? null,
      productOrder,
      products,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
