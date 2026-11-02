import { existsSync, readFileSync } from 'node:fs';
import { z } from '../validation/zod.js';
import { envSchema, type Env } from './env.schema.js';

let current: Env | undefined;

export function loadEnv(envPath: string): void {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

export function readEnv(source: NodeJS.ProcessEnv): Env {
  const defined = Object.fromEntries(Object.entries(source).filter(([, value]) => value));
  const result = envSchema.safeParse(defined);
  if (!result.success)
    throw new Error(
      `Variables d'environnement invalides (fichier server/.env ou terminal). ${z.prettifyError(result.error)}`,
    );
  return result.data;
}

export function env(): Env {
  current ??= readEnv(process.env);
  return current;
}
