import { Alert, Button, Stack, Typography } from '@mui/material';
import { EmptyState } from '@/shared/EmptyState';
import { FilterBar } from './FilterBar';
import { useIncidentFilterStore } from './incidentFilterStore';
import { IncidentListSkeleton } from './IncidentListSkeleton';
import { IncidentRows } from './IncidentRows';
import { SavedViewTabs } from './SavedViewTabs';
import { useIncidents } from './useIncidents';

function IncidentListBody() {
  const filters = useIncidentFilterStore((s) => s.filters);
  const list = useIncidents(filters);
  const { rows, isError, isFetching, isFetchNextPageError } = list;

  if (list.isPending) return <IncidentListSkeleton />;

  const retry = (
    <Button color="inherit" size="small" onClick={() => void list.refetch()} disabled={isFetching}>
      Retry
    </Button>
  );

  // A failed first load; a failed later page keeps the rows and reports inside the list.
  if (isError && rows.length === 0) {
    return (
      <Alert severity="error" action={retry}>
        The incidents could not be loaded.
      </Alert>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No incidents match"
        description="There are no incidents for your teams yet, or none match the current filters."
      />
    );
  }

  return (
    <Stack spacing={3}>
      {/* A failed refresh keeps the cached rows; a failed next page reports inside the list. */}
      {isError && !isFetchNextPageError && (
        <Alert severity="error" action={retry}>
          The incidents could not be refreshed.
        </Alert>
      )}
      <IncidentRows
        rows={rows}
        hasNextPage={list.hasNextPage}
        isFetchingNextPage={list.isFetchingNextPage}
        isFetchNextPageError={isFetchNextPageError}
        onLoadMore={() => void list.fetchNextPage()}
      />
    </Stack>
  );
}

export default function IncidentListRoute() {
  return (
    <Stack spacing={4} sx={{ p: 6 }}>
      <Typography variant="titlePage" component="h1">
        Incidents
      </Typography>
      <SavedViewTabs />
      <FilterBar />
      <IncidentListBody />
    </Stack>
  );
}
