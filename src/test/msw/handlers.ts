import { http, HttpResponse, type RequestHandler } from 'msw';
import { config } from '@/app/config';
import { catalogApp, checkoutApp, createdIncident, pendingAttachment } from './fixtures';

// Wildcard origin: this module also loads in the node test environment, where `window` is undefined.
const api = (path: string) => `*${config.apiBaseUrl}${path}`;

// Shared default handlers. GET /api/v1/me is added once BE-11 ships (FE-02.02 useCurrentUser).
export const handlers: RequestHandler[] = [
  http.get(api('/applications'), () =>
    HttpResponse.json({ items: [checkoutApp, catalogApp], nextCursor: null, totalCount: null }),
  ),
  http.post(api('/incidents'), () => HttpResponse.json(createdIncident, { status: 201 })),
  http.post(api('/attachments'), async ({ request }) => {
    const file = (await request.formData()).get('file');
    const fileName = file instanceof File ? file.name : pendingAttachment.fileName;
    return HttpResponse.json({ ...pendingAttachment, fileName }, { status: 201 });
  }),
];
