import { Box, Button, FormHelperText, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useController } from 'react-hook-form';
import { AttachmentRow } from './AttachmentRow';
import { ACCEPT, partitionFiles, type RejectedFile } from './attachmentRules';
import type { ReportControl } from './reportFormTypes';
import { ATTACHMENTS_MAX } from './reportIncident.schema';

interface Entry {
  key: string;
  file: File;
}

interface AttachmentDropzoneProps {
  control: ReportControl;
  /** True while at least one file is still uploading. */
  onPendingChange: (pending: boolean) => void;
}

/** Uploads files as they are added and keeps the form's `attachmentIds` in sync with the usable ones. */
export function AttachmentDropzone({ control, onPendingChange }: AttachmentDropzoneProps) {
  const { field, fieldState } = useController({ control, name: 'attachmentIds' });
  const { onChange } = field;
  const inputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(new Set());

  // Rows add ids in the same commit, so the latest list is tracked synchronously instead of via `field.value`.
  const ids = useRef<string[]>(field.value ?? []);
  const addId = useCallback(
    (id: string) => {
      if (ids.current.includes(id)) return;
      ids.current = [...ids.current, id];
      onChange(ids.current);
    },
    [onChange],
  );
  const removeId = useCallback(
    (id: string) => {
      ids.current = ids.current.filter((existing) => existing !== id);
      onChange(ids.current);
    },
    [onChange],
  );

  const setPending = useCallback((key: string, pending: boolean) => {
    setPendingKeys((current) => {
      if (current.has(key) === pending) return current;
      const next = new Set(current);
      if (pending) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const uploading = pendingKeys.size > 0;
  useEffect(() => onPendingChange(uploading), [uploading, onPendingChange]);

  const removeEntry = useCallback((key: string) => {
    setEntries((current) => current.filter((entry) => entry.key !== key));
  }, []);

  function addFiles(files: File[]) {
    const { accepted, rejected: refused } = partitionFiles(files, ATTACHMENTS_MAX - entries.length);
    setRejected(refused);
    if (accepted.length > 0) {
      setEntries((current) => [...current, ...accepted.map((file) => ({ key: crypto.randomUUID(), file }))]);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = ''; // allow choosing the same file again after removing it
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <Box component="section" aria-labelledby="attachments-heading">
      <Typography id="attachments-heading" variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
        Attachments
      </Typography>
      <Stack
        spacing={2}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        sx={{
          alignItems: 'flex-start',
          p: 4,
          border: 2,
          borderStyle: 'dashed',
          borderColor: dragging ? 'primary.main' : 'lineStrong',
          borderRadius: 2,
          bgcolor: dragging ? 'brandTint' : 'transparent',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Drag files here, or choose them. Images (PNG, JPG, GIF, WebP) and text, log or JSON files, up to 25 MB
          each, {ATTACHMENTS_MAX} files at most.
        </Typography>
        <Button variant="outlined" onClick={() => inputRef.current?.click()}>
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          aria-label="Attachment files"
          aria-hidden
          tabIndex={-1}
          onChange={handleChange}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
        />
      </Stack>
      {rejected.length > 0 && (
        <Box role="alert" sx={{ mt: 2 }}>
          <Stack component="ul" sx={{ m: 0, pl: 4 }}>
            {rejected.map(({ name, reason }, index) => (
              <Typography key={`${name}-${index}`} component="li" variant="body2" color="error">
                {name}: {reason}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}
      {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
      {entries.length > 0 && (
        <Stack component="ul" aria-label="Selected files" sx={{ m: 0, mt: 2, p: 0 }}>
          {entries.map(({ key, file }) => (
            <AttachmentRow
              key={key}
              entryKey={key}
              file={file}
              onRemove={removeEntry}
              onUsable={addId}
              onUnusable={removeId}
              onPendingChange={setPending}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
