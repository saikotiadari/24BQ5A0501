export type LogStack = 'backend' | 'frontend';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type BackendPackage = 'cache' | 'controller' | 'cron_job' | 'db' | 'domain' | 'handler' | 'repository' | 'route' | 'service' | 'auth' | 'config' | 'middleware' | 'utils';

export interface LogPayload {
  stack: LogStack;
  level: LogLevel;
  package: BackendPackage;
  message: string;
}