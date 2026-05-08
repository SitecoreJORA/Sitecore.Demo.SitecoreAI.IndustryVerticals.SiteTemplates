import type { NextApiRequest, NextApiResponse } from 'next';
import { CONTENT_HUB_CONFIG } from '@/constants/content-hub';

type SuccessResponse = {
  id: string;
  sCHOTT_ProductDataSheet: string | null;
  /** SCHOTT.DiagramData JSON when exposed on the PCM Product entity in Content Hub GraphQL. */
  sCHOTT_DiagramData: string | null;
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
    // Matches Postman working setup: X-GQL-Token: <token>
    headers['X-GQL-Token'] = padBase64(previewToken);
  }

  return headers;
}

type GraphQlPayload = {
  data?: {
    m_PCM_Product?: {
      sCHOTT_ProductDataSheet?: string | null;
      sCHOTT_DiagramData?: string | null;
    } | null;
  } | null;
  errors?: Array<{ message?: string }>;
};

async function postContentHubGraphql(
  query: string,
  id: string
): Promise<{ response: Response; raw: string; json: GraphQlPayload | null }> {
  const response = await fetch(CONTENT_HUB_CONFIG.graphqlPreviewUrl, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ query, variables: { id } }),
  });
  const raw = await response.text();
  let json: GraphQlPayload | null = null;
  try {
    json = JSON.parse(raw) as GraphQlPayload;
  } catch {
    json = null;
  }
  return { response, raw, json };
}

/** When the preview schema has no `sCHOTT_DiagramData` field, retry without it so the datasheet still loads. */
function shouldRetryDatasheetOnly(errors: Array<{ message?: string }>): boolean {
  const msg = errors.map((e) => e?.message ?? '').join('; ');
  return (
    /sCHOTT_DiagramData/i.test(msg) &&
    /cannot query field|unknown field|undefinedfield|undefined field/i.test(msg)
  );
}

const QUERY_PRODUCT_DATASHEET_AND_DIAGRAM = /* GraphQL */ `
  query ProductDataSheet($id: String!) {
    m_PCM_Product(id: $id) {
      sCHOTT_ProductDataSheet
      sCHOTT_DiagramData
    }
  }
`;

const QUERY_PRODUCT_DATASHEET_ONLY = /* GraphQL */ `
  query ProductDataSheet($id: String!) {
    m_PCM_Product(id: $id) {
      sCHOTT_ProductDataSheet
    }
  }
`;

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
    let { response, raw, json } = await postContentHubGraphql(
      QUERY_PRODUCT_DATASHEET_AND_DIAGRAM,
      id
    );

    if (json?.errors?.length && shouldRetryDatasheetOnly(json.errors)) {
      const second = await postContentHubGraphql(QUERY_PRODUCT_DATASHEET_ONLY, id);
      response = second.response;
      raw = second.raw;
      json = second.json;
    }

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

    const product = json?.data?.m_PCM_Product;
    const dataSheet = product?.sCHOTT_ProductDataSheet ?? null;
    const diagramData = product?.sCHOTT_DiagramData ?? null;
    return res.status(200).json({
      id,
      sCHOTT_ProductDataSheet: dataSheet,
      sCHOTT_DiagramData: diagramData,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
