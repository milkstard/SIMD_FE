import { Box } from '@mui/material';
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';
import { IncidentListFooter } from './IncidentListFooter';
import { incidentColumns } from './incidentColumns';
import type { IncidentSort } from './incidentFilters';
import { fromSortModel, toSortModel } from './incidentSort';
import type { IncidentRow } from './useIncidents';
import { useLoadMoreOnScroll } from './useLoadMoreOnScroll';

interface IncidentListProps {
  rows: IncidentRow[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onLoadMore: () => void;
  sort: IncidentSort;
  onSortChange: (sort: IncidentSort) => void;
}

const getRowId = (row: IncidentRow) => row.id ?? row.number ?? '';

/**
 * Virtualized grid over the infinite query's rows. Rows change only through the Query cache, so a live
 * `IncidentUpdated` patch reaches one row without touching the others. The MIT grid always paginates, so
 * server mode (every passed row is shown) with the footer hidden gives one continuous list.
 */
export function IncidentList({
  rows,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
  sort,
  onSortChange,
}: IncidentListProps) {
  const apiRef = useGridApiRef();
  useLoadMoreOnScroll({
    apiRef,
    rowCount: rows.length,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    onLoadMore,
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ height: 'calc(100vh - 400px)', minHeight: 360 }}>
        <DataGrid
          apiRef={apiRef}
          aria-label="Incidents"
          rows={rows}
          columns={incidentColumns}
          getRowId={getRowId}
          paginationMode="server"
          rowCount={rows.length}
          hideFooter
          sortingMode="server"
          sortModel={toSortModel(sort)}
          onSortModelChange={(model) => onSortChange(fromSortModel(model))}
          disableRowSelectionOnClick
          disableColumnMenu
          disableColumnFilter
          sx={{
            bgcolor: 'background.paper',
            borderColor: 'divider',
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'surface200' },
          }}
        />
      </Box>
      <IncidentListFooter
        isFetchingNextPage={isFetchingNextPage}
        isFetchNextPageError={isFetchNextPageError}
        onRetry={onLoadMore}
      />
    </Box>
  );
}
