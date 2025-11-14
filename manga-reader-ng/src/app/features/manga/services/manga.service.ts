import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../core/services/api-client.service';
import { Observable } from 'rxjs';

export interface MangaItem {
  id: string;
  name: string;
  size?: number;
  createdTime?: string;
  modifiedTime?: string;
  downloadUrl?: string;
  readUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class MangaService {
  private readonly api = inject(ApiClientService);

  getAllManga(): Observable<MangaItem[]> {
    return this.api.get<MangaItem[]>('/api/manga');
  }
}


