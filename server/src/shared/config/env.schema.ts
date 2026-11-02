import { z } from '../validation/zod.js';

const DEFAULT_PORT = 3003;
const MAX_PORT = 65_535;
const DEFAULT_IDLE_MINUTES = 10;
const ENABLED = '1';
const DIR_SEPARATOR = /[;,]/;

const flag = z
  .enum(['0', ENABLED])
  .optional()
  .transform((value) => value === ENABLED);

export const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(MAX_PORT).default(DEFAULT_PORT),
  STUDIA_LAN: flag,
  STUDIA_IDLE_MINUTES: z.coerce.number().min(0).default(DEFAULT_IDLE_MINUTES),
  STUDIA_MEMORY_GB: z.coerce.number().positive().optional(),
  STUDIA_IGNORE_LIMITS: flag,
  STUDIA_EXTRA_MODEL_DIRS: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? '')
        .split(DIR_SEPARATOR)
        .map((dir) => dir.trim())
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof envSchema>;
