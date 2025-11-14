import { Injectable } from '@angular/core';
import JSZip from 'jszip';

export interface ExtractedImage {
  name: string;
  url: string;
}

export interface ExtractedManga {
  id: string;
  name: string;
  pages: number;
  addedDate: number;
}

export interface ExtractCbzResult {
  images: ExtractedImage[];
  manga: ExtractedManga;
}

@Injectable({ providedIn: 'root' })
export class CbzService {
  async extractCbz(file: File): Promise<ExtractCbzResult> {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    const images: ExtractedImage[] = [];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    for (const filename of Object.keys(contents.files)) {
      const zipFile = contents.files[filename];
      if (!zipFile.dir && imageExtensions.some((ext) => filename.toLowerCase().endsWith(ext))) {
        const blob = await zipFile.async('blob');
        const url = URL.createObjectURL(blob);
        images.push({ name: filename, url });
      }
    }
    images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const manga: ExtractedManga = {
      id: Date.now().toString(),
      name: file.name.replace(/\.cbz$/i, ''),
      pages: images.length,
      addedDate: Date.now(),
    };
    return { images, manga };
  }
}


