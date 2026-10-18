import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/api/client';
import type { components } from '@/api/generated/schema';

export type Attachment = components['schemas']['AttachmentDto'];

/** `POST /attachments` (multipart, one part named `file`). No Content-Type header: the browser adds the boundary. */
export function useUploadAttachment() {
  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append('file', file);
      return apiRequest<Attachment>('/attachments', { method: 'POST', body });
    },
  });
}
