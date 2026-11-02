import type { z } from '@/utils/zod';

export function parseJson<T>(content: string, schema: z.ZodType<T>): T | undefined {
  try {
    const result = schema.safeParse(JSON.parse(content));
    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}
