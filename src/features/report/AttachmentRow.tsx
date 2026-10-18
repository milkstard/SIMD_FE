import CloseOutlined from '@mui/icons-material/CloseOutlined';
import { Box, Button, IconButton, LinearProgress, Stack, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';
import { ApiError } from '@/api/client';
import { ScanStatusBadge } from '@/shared/ScanStatusBadge';
import { formatBytes } from './attachmentRules';
import { fieldMessages } from './problemMapping';
import { useUploadAttachment } from './useUploadAttachment';

interface AttachmentRowProps {
  entryKey: string;
  file: File;
  onRemove: (entryKey: string) => void;
  /** Called with the server id while the file is usable (uploaded and not infected). */
  onUsable: (id: string) => void;
  onUnusable: (id: string) => void;
  onPendingChange: (entryKey: string, pending: boolean) => void;
}

function uploadErrorMessage(error: unknown): { message: string; retry: boolean } {
  if (error instanceof ApiError) {
    if (error.status === 413) return { message: 'The file is larger than 25 MB.', retry: false };
    if (error.status === 422) {
      const [first] = fieldMessages(error.problem, 'file');
      return { message: first ?? 'This file type is not allowed.', retry: false };
    }
  }
  return { message: 'Upload failed.', retry: true };
}

export function AttachmentRow({ entryKey, file, onRemove, onUsable, onUnusable, onPendingChange }: AttachmentRowProps) {
  const upload = useUploadAttachment();
  const { mutate } = upload;
  // StrictMode runs effects twice; the ref keeps it to one request per file.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    mutate(file);
  }, [file, mutate]);

  const pending = !upload.isError && !upload.isSuccess;
  useEffect(() => {
    onPendingChange(entryKey, pending);
    return () => onPendingChange(entryKey, false);
  }, [entryKey, pending, onPendingChange]);

  const attachment = upload.data;
  const infected = attachment?.scanStatus === 'Infected';
  const usableId = attachment && !infected ? attachment.id : undefined;
  useEffect(() => {
    if (!usableId) return;
    onUsable(usableId);
    return () => onUnusable(usableId);
  }, [usableId, onUsable, onUnusable]);

  const failure = upload.isError ? uploadErrorMessage(upload.error) : null;

  return (
    <Stack
      component="li"
      spacing={1}
      sx={{ listStyle: 'none', py: 2, borderBottom: 1, borderColor: 'divider' }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" noWrap title={file.name}>
            {file.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatBytes(file.size)}
          </Typography>
        </Box>
        {attachment?.scanStatus && <ScanStatusBadge status={attachment.scanStatus} />}
        <IconButton size="small" aria-label={`Remove ${file.name}`} onClick={() => onRemove(entryKey)}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </Stack>
      {pending && (
        <Box>
          <LinearProgress aria-label={`Uploading ${file.name}`} />
          <Typography variant="caption" color="text.secondary">
            Uploading…
          </Typography>
        </Box>
      )}
      {failure && (
        <Stack direction="row" spacing={2} role="alert" sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="error">
            {failure.message}
          </Typography>
          {failure.retry && (
            <Button size="small" onClick={() => mutate(file)}>
              Retry
            </Button>
          )}
        </Stack>
      )}
      {infected && (
        <Typography variant="body2" color="error" role="alert">
          This file is infected and will not be attached.
        </Typography>
      )}
    </Stack>
  );
}
