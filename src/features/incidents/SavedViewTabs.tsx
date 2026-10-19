import { Box, Tab, Tabs, Typography } from '@mui/material';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useIncidentFilterStore } from './incidentFilterStore';
import { SAVED_VIEWS } from './savedViews';

const NO_TEAM_HINT_ID = 'saved-view-no-team';

export function SavedViewTabs() {
  const { data: user } = useCurrentUser();
  const activeViewId = useIncidentFilterStore((s) => s.activeViewId);
  const applyView = useIncidentFilterStore((s) => s.applyView);

  const noTeam = user !== undefined && SAVED_VIEWS.find((v) => v.id === 'team')?.filters(user) === null;

  return (
    <Box>
      {/* No value = no tab selected, which is the state after a filter was edited by hand. */}
      <Tabs value={activeViewId ?? false} aria-label="Saved views" variant="scrollable" scrollButtons="auto">
        {SAVED_VIEWS.map((view) => {
          const filters = view.filters(user);
          const isTeamWithoutTeam = view.id === 'team' && noTeam;
          return (
            <Tab
              key={view.id}
              value={view.id}
              label={view.label}
              disabled={filters === null}
              aria-describedby={isTeamWithoutTeam ? NO_TEAM_HINT_ID : undefined}
              onClick={() => {
                if (filters) applyView(view.id, filters);
              }}
            />
          );
        })}
      </Tabs>
      {noTeam && (
        <Typography id={NO_TEAM_HINT_ID} variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          “My team” needs a team membership. You are not in a team yet.
        </Typography>
      )}
    </Box>
  );
}
