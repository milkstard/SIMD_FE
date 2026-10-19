import { http, HttpResponse, type RequestHandler } from 'msw';
import { config } from '@/app/config';
import { currentUser, listIncidents } from './fixtures';

const api = (path: string) => `*${config.apiBaseUrl}${path}`;
const CURSOR = /^offset:(\d+)$/;

const problem = (status: number, title: string) =>
  HttpResponse.json({ title, status }, { status, headers: { 'content-type': 'application/problem+json' } });

/**
 * `GET /incidents` over the fixture list: repeated status/severity, assigneeId (`me`, `unassigned`, id), applicationId, teamId, slaBreached and q filters,
 * cursor paging (`offset:N`) and the contract's 422s.
 */
export const incidentHandlers: RequestHandler[] = [
  http.get(api('/incidents'), ({ request }) => {
    const params = new URL(request.url).searchParams;

    const limit = Number(params.get('limit') ?? 25);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) return problem(422, 'Invalid limit');
    if ((params.get('q') ?? '').length > 200) return problem(422, 'Invalid q');

    const cursor = params.get('cursor');
    const offset = cursor === null ? 0 : Number(CURSOR.exec(cursor)?.[1]);
    if (Number.isNaN(offset)) return problem(422, 'Invalid cursor');

    const statuses = params.getAll('status');
    const severities = params.getAll('severity');
    const q = params.get('q')?.toLowerCase();
    const assigneeId = params.get('assigneeId');
    const applicationId = params.get('applicationId');
    const teamId = params.get('teamId');
    const matches = listIncidents.filter(
      (incident) =>
        (statuses.length === 0 || statuses.includes(incident.status ?? '')) &&
        (severities.length === 0 || severities.includes(incident.severity ?? '')) &&
        (params.get('slaBreached') !== 'true' || incident.isSlaBreached) &&
        (assigneeId === null ||
          (assigneeId === 'unassigned' && !incident.assignee) ||
          (assigneeId === 'me' && incident.assignee?.id === currentUser.id) ||
          incident.assignee?.id === assigneeId) &&
        (applicationId === null || incident.application?.id === applicationId) &&
        (teamId === null || incident.assignedTeam?.id === teamId) &&
        (!q || incident.title?.toLowerCase().includes(q)),
    );

    const items = matches.slice(offset, offset + limit);
    const next = offset + limit;
    return HttpResponse.json({
      items,
      nextCursor: next < matches.length ? `offset:${next}` : null,
      totalCount: null,
    });
  }),
];
