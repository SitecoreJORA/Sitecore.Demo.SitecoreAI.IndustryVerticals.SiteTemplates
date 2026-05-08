import type { NextApiRequest, NextApiResponse } from 'next';

const CONTENT_HUB_PREVIEW_GQL_URL =
  'https://almu-schott.sitecoresandbox.cloud/api/graphql/preview/v1';

type SuccessResponse = {
  id: string;
  sCHOTT_ProductDataSheet: string | null;
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
  const previewToken = process.env.CH_PREVIEW_TOKEN?.trim();

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

  const query = /* GraphQL */ `
    query ProductDataSheet($id: String!) {
      m_PCM_Product(id: $id) {
        sCHOTT_ProductDataSheet
      }
    }
  `;

  try {
    const response = await fetch(CONTENT_HUB_PREVIEW_GQL_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query, variables: { id } }),
    });

    const raw = await response.text();
    const contentType = response.headers.get('content-type') || '';

    const json = (() => {
      try {
        return JSON.parse(raw) as {
          data?: { m_PCM_Product?: { sCHOTT_ProductDataSheet?: string | null } | null } | null;
          errors?: Array<{ message?: string }>;
        };
      } catch {
        return null;
      }
    })();

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

    const dataSheet = json?.data?.m_PCM_Product?.sCHOTT_ProductDataSheet ?? null;
    return res.status(200).json({ id, sCHOTT_ProductDataSheet: dataSheet });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
