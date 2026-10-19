import { http, HttpResponse, type RequestHandler } from 'msw';
import { config } from '@/app/config';
import { catalogApp, checkoutApp, createdIncident, currentUser, pendingAttachment } from './fixtures';

// Wildcard origin: this module also loads in the node test environment, where `window` is undefined.
const api = (path: string) => `*${config.apiBaseUrl}${path}`;

// Shared default handlers.
export const handlers: RequestHandler[] = [
  http.get(api('/me'), () => HttpResponse.json(currentUser)),
  http.get(api('/applications'), () =>
    HttpResponse.json({ items: [checkoutApp, catalogApp], nextCursor: null, totalCount: null }),
  ),
  http.get(api('/incidents/similar'), () => HttpResponse.json([])),
  http.post(api('/incidents'), () => HttpResponse.json(createdIncident, { status: 201 })),
  http.post(api('/attachments'), async ({ request }) => {
    const file = (await request.formData()).get('file');
    const fileName = file instanceof File ? file.name : pendingAttachment.fileName;
    return HttpResponse.json({ ...pendingAttachment, fileName }, { status: 201 });
  }),
];
