import { HttpInterceptorFn } from '@angular/common/http';

// Placeholder interceptor: attach auth header when applicable.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  try {
    const token = localStorage.getItem('manga-reader:auth:token');
    if (token) {
      const cloned = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next(cloned);
    }
  } catch {
    // noop
  }
  return next(req);
};




