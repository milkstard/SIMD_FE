import type { GridColDef } from '@mui/x-data-grid';
import { AssigneeCell, NumberCell, SeverityCell, StatusCell, UpdatedCell } from './IncidentCells';
import type { IncidentRow } from './useIncidents';

// Only the contract's server sorts are offered: Severity and Updated, most severe / newest first.
const serverSort = { sortable: true, sortingOrder: ['desc', null] } as const;

/** Module-level so the grid sees one stable column definition. */
export const incidentColumns: GridColDef<IncidentRow>[] = [
  {
    field: 'number',
    headerName: 'Number',
    width: 120,
    sortable: false,
    renderCell: ({ row, tabIndex }) => <NumberCell number={row.number} tabIndex={tabIndex} />,
  },
  { field: 'title', headerName: 'Title', flex: 1, minWidth: 240, sortable: false },
  {
    field: 'application',
    headerName: 'Application',
    width: 160,
    sortable: false,
    valueGetter: (_value, row) => row.application?.name ?? '',
  },
  {
    field: 'severity',
    headerName: 'Severity',
    width: 130,
    ...serverSort,
    renderCell: ({ row }) => <SeverityCell severity={row.severity} />,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 150,
    sortable: false,
    renderCell: ({ row }) => <StatusCell status={row.status} />,
  },
  {
    field: 'assignee',
    headerName: 'Assignee',
    width: 180,
    sortable: false,
    valueGetter: (_value, row) => row.assignee?.displayName ?? '',
    renderCell: ({ row }) => <AssigneeCell name={row.assignee?.displayName} />,
  },
  {
    field: 'updatedAt',
    headerName: 'Updated',
    width: 140,
    ...serverSort,
    renderCell: ({ row }) => <UpdatedCell value={row.updatedAt} />,
  },
];
