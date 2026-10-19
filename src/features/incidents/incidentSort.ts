import type { GridSortModel } from '@mui/x-data-grid';
import { DEFAULT_SORT, type IncidentSort } from './incidentFilters';

/**
 * The grid shows the contract's server sorts on two columns, each in one direction:
 * Severity (`severity`, most severe first) and Updated (`-updatedAt`, newest first).
 * Anything else is the default order, which has no column.
 */
export function toSortModel(sort: IncidentSort): GridSortModel {
  if (sort === 'severity') return [{ field: 'severity', sort: 'desc' }];
  if (sort === '-updatedAt') return [{ field: 'updatedAt', sort: 'desc' }];
  return [];
}

export function fromSortModel(model: GridSortModel): IncidentSort {
  const first = model[0];
  if (first?.sort !== 'desc') return DEFAULT_SORT;
  if (first.field === 'severity') return 'severity';
  if (first.field === 'updatedAt') return '-updatedAt';
  return DEFAULT_SORT;
}
