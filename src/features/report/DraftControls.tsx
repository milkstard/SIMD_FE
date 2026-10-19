import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useState } from 'react';

export function DraftRestoredNotice({ onClose }: { onClose: () => void }) {
  return (
    <Alert severity="info" onClose={onClose}>
      Draft restored
    </Alert>
  );
}

interface DiscardDraftButtonProps {
  onDiscard: () => void;
  disabled?: boolean;
}

/** Asks before throwing the saved draft away; the caller clears the storage and resets the form. */
export function DiscardDraftButton({ onDiscard, disabled }: DiscardDraftButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outlined"
        size="large"
        color="inherit"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Discard draft
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="discard-draft-title">
        <DialogTitle id="discard-draft-title">Discard this draft?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The saved draft is deleted from this device and the form is emptied. This can&apos;t be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpen(false);
              onDiscard();
            }}
          >
            Discard
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
