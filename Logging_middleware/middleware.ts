import { Request, Response, NextFunction } from 'express';
import {Log} from './logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const elapsed = Date.now() - start;
    const msg = `${req.method} ${req.originalUrl} finished with status ${res.statusCode} in ${elapsed}ms`;
    let level: 'info' | 'warn' | 'error' = 'info';
    if (res.statusCode >= 400 && res.statusCode < 500) level = 'warn';
    if (res.statusCode >= 500) level = 'error';

    Log('backend', level, 'middleware', msg);
  });

  next();
}