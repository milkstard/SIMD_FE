import { ATTACHMENTS_MAX } from './reportIncident.schema';

// Limits mirror API-CONTRACT §5 (Attachments). The server stays the authority.
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  txt: 'text/plain',
  log: 'text/plain',
  json: 'application/json',
};

/** Value for the file input's `accept` attribute. */
export const ACCEPT = Object.keys(ALLOWED_TYPES)
  .map((ext) => `.${ext}`)
  .join(',');

export type FileCheck = { ok: true; file: File } | { ok: false; reason: string };

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase();
}

/**
 * Client-side checks before any network call. Browsers often report an empty type for `.log`/`.json`,
 * so an empty type is accepted and the file is re-typed from its extension; a non-empty type must agree.
 */
export function checkFile(file: File): FileCheck {
  const extension = extensionOf(file.name);
  const expected = ALLOWED_TYPES[extension];

  if (!expected) {
    return {
      ok: false,
      reason:
        extension === 'svg' || extension === 'pdf'
          ? `${extension.toUpperCase()} files are not allowed.`
          : 'This file type is not allowed.',
    };
  }
  if (file.type !== '' && file.type !== expected) {
    return { ok: false, reason: 'The file type does not match its extension.' };
  }
  if (file.size === 0) return { ok: false, reason: 'The file is empty.' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, reason: 'The file is larger than 25 MB.' };

  return { ok: true, file: file.type === '' ? new File([file], file.name, { type: expected }) : file };
}

export interface RejectedFile {
  name: string;
  reason: string;
}

/** Splits dropped/chosen files into those to upload and those rejected (with the reason to show). */
export function partitionFiles(files: readonly File[], slotsLeft: number) {
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];
  let slots = slotsLeft;

  for (const file of files) {
    const result = checkFile(file);
    if (!result.ok) {
      rejected.push({ name: file.name, reason: result.reason });
    } else if (slots <= 0) {
      rejected.push({ name: file.name, reason: `At most ${ATTACHMENTS_MAX} files per report.` });
    } else {
      slots--;
      accepted.push(result.file);
    }
  }
  return { accepted, rejected };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
