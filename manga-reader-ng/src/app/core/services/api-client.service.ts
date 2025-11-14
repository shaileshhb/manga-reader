import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface RequestOptions {
  headers?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly baseUrl = environment.apiBaseUrl ?? '';

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, options?: RequestOptions): Observable<T> {
    return this.http
      .get<T>(this.url(path), { headers: this.headers(options) })
      .pipe(catchError(this.handleError));
  }

  post<T, B = unknown>(path: string, body: B, options?: RequestOptions): Observable<T> {
    return this.http
      .post<T>(this.url(path), body, { headers: this.headers(options) })
      .pipe(catchError(this.handleError));
  }

  put<T, B = unknown>(path: string, body: B, options?: RequestOptions): Observable<T> {
    return this.http
      .put<T>(this.url(path), body, { headers: this.headers(options) })
      .pipe(catchError(this.handleError));
  }

  patch<T, B = unknown>(path: string, body: B, options?: RequestOptions): Observable<T> {
    return this.http
      .patch<T>(this.url(path), body, { headers: this.headers(options) })
      .pipe(catchError(this.handleError));
  }

  delete<T>(path: string, options?: RequestOptions): Observable<T> {
    return this.http
      .delete<T>(this.url(path), { headers: this.headers(options) })
      .pipe(catchError(this.handleError));
  }

  private url(path: string): string {
    if (!this.baseUrl) return path;
    return `${this.baseUrl}${path}`;
  }

  private headers(options?: RequestOptions): HttpHeaders {
    const base: Record<string, string> = { 'Content-Type': 'application/json' };
    const merged = { ...base, ...(options?.headers ?? {}) };
    return new HttpHeaders(merged);
  }

  private handleError(error: HttpErrorResponse) {
    const err = new Error('API request failed') as Error & { status?: number; data?: unknown };
    err.status = error.status;
    err.data = error.error;
    return throwError(() => err);
  }
}


