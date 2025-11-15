export function makeSafeFilename(name: string, ext: string = 'cbz'): string {
  const base =
    String(name || 'manga')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9 _.-]+/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'manga';
  return base.toString().replace(/\.$/, '') + `.${ext}`;
}

export const buildReadUrl = (id: string) => `/api/manga/${encodeURIComponent(id)}/read`;

export const buildDownloadUrl = (id: string, name: string) =>
  `/api/manga/${encodeURIComponent(id)}/download?filename=${encodeURIComponent(makeSafeFilename(name))}`;




