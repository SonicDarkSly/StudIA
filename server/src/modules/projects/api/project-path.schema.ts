import { z } from 'zod';

export const projectPathSchema = z.object({ path: z.string().optional() });

export type ProjectPathInput = z.infer<typeof projectPathSchema>;

export const folderPathSchema = z.string().optional();
