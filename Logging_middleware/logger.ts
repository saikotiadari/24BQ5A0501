import axios from 'axios';
import { LogStack, LogLevel, BackendPackage, LogPayload } from './types';

const TEST_SERVER_URL = 'http://4.224.186.213/evaluation-service/logs';

export async function Log(
  stack: LogStack,
  level: LogLevel,
  pack: BackendPackage, 
  message: string
): Promise<void> {
  const payload: LogPayload = {
    stack: stack.toLowerCase() as LogStack,
    level: level.toLowerCase() as LogLevel,
    package: pack.toLowerCase() as BackendPackage,
    message,
  };

  try {
    await axios.post(TEST_SERVER_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`[Eval Log Sent]: ${level.toUpperCase()} - ${message}`);
  } catch (error: any) {
    console.error('[Eval Log Failed]:', error.response?.data || error.message);
  }
}