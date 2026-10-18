import { checkFile, formatBytes, MAX_FILE_BYTES, partitionFiles } from './attachmentRules';

function makeFile(name: string, type: string, size = 10) {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('checkFile', () => {
  it('accepts every allowed extension with its matching type', () => {
    for (const [name, type] of [
      ['a.png', 'image/png'],
      ['a.jpg', 'image/jpeg'],
      ['a.JPEG', 'image/jpeg'],
      ['a.gif', 'image/gif'],
      ['a.webp', 'image/webp'],
      ['a.txt', 'text/plain'],
      ['a.log', 'text/plain'],
      ['a.json', 'application/json'],
    ]) {
      expect(checkFile(makeFile(name, type)).ok, name).toBe(true);
    }
  });

  it('rejects a file over 25 MB and accepts exactly 25 MB', () => {
    expect(checkFile(makeFile('a.png', 'image/png', MAX_FILE_BYTES + 1))).toEqual({
      ok: false,
      reason: 'The file is larger than 25 MB.',
    });
    expect(checkFile(makeFile('a.png', 'image/png', MAX_FILE_BYTES)).ok).toBe(true);
  });

  it('rejects other extensions, naming SVG and PDF', () => {
    expect(checkFile(makeFile('a.exe', 'application/octet-stream'))).toMatchObject({ ok: false });
    expect(checkFile(makeFile('a.svg', 'image/svg+xml'))).toEqual({ ok: false, reason: 'SVG files are not allowed.' });
    expect(checkFile(makeFile('a.pdf', 'application/pdf'))).toEqual({ ok: false, reason: 'PDF files are not allowed.' });
    expect(checkFile(makeFile('noextension', 'text/plain'))).toMatchObject({ ok: false });
  });

  it('rejects a type that disagrees with the extension', () => {
    expect(checkFile(makeFile('a.png', 'text/plain'))).toEqual({
      ok: false,
      reason: 'The file type does not match its extension.',
    });
  });

  it('rejects an empty file', () => {
    expect(checkFile(makeFile('a.txt', 'text/plain', 0))).toEqual({ ok: false, reason: 'The file is empty.' });
  });

  it('accepts an empty type and re-types the file from its extension', () => {
    const result = checkFile(makeFile('server.log', ''));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.file.type).toBe('text/plain');
  });
});

describe('partitionFiles', () => {
  it('rejects files beyond the free slots', () => {
    const files = Array.from({ length: 11 }, (_, i) => makeFile(`f${i}.png`, 'image/png'));

    const { accepted, rejected } = partitionFiles(files, 10);

    expect(accepted).toHaveLength(10);
    expect(rejected).toEqual([{ name: 'f10.png', reason: 'At most 10 files per report.' }]);
  });

  it('keeps accepted and rejected files apart', () => {
    const { accepted, rejected } = partitionFiles(
      [makeFile('a.png', 'image/png'), makeFile('b.svg', 'image/svg+xml')],
      10,
    );

    expect(accepted.map((f) => f.name)).toEqual(['a.png']);
    expect(rejected.map((f) => f.name)).toEqual(['b.svg']);
  });
});

describe('formatBytes', () => {
  it('formats bytes, KB and MB', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
