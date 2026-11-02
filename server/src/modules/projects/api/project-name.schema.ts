import { z } from 'zod';

const MAX_NAME_LENGTH = 255;
const FORBIDDEN_NAMES = ['.', '..'];

export const projectNameSchema = z
  .string()
  .min(1)
  .max(MAX_NAME_LENGTH)
  .refine((name) => !name.includes('/') && !FORBIDDEN_NAMES.includes(name), {
    message: 'Nom de projet invalide',
  });
