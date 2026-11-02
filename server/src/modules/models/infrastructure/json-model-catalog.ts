import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { MODELS_FILE } from '../../../shared/config/paths.js';
import { UnknownModelError, type CatalogModel } from '../domain/catalog-model.js';
import type { ModelCatalog } from '../domain/model-catalog.js';
import { partialSettingsSchema } from '../domain/generation-settings.js';

const catalogModelSchema = z.object({
  key: z.string(),
  label: z.string(),
  publisher: z.string(),
  family: z.string(),
  sizeGb: z.number(),
  ramGb: z.number(),
  capabilities: z.array(z.string()),
  idealFor: z.array(z.string()),
  description: z.string(),
  pros: z.string(),
  cons: z.string(),
  license: z.string(),
  uris: z.array(z.string()).min(1),
  thinking: z.boolean(),
  thinkingAlways: z.boolean().optional(),
  recommended: partialSettingsSchema,
}) satisfies z.ZodType<CatalogModel>;

const catalogSchema = z.object({ models: z.array(catalogModelSchema) });

@Injectable()
export class JsonModelCatalog implements ModelCatalog {
  all(): CatalogModel[] {
    const parsed = catalogSchema.safeParse(JSON.parse(readFileSync(MODELS_FILE, 'utf8')));
    if (!parsed.success) throw new Error(`server/models.json invalide. ${z.prettifyError(parsed.error)}`);
    return parsed.data.models;
  }

  get(key: string): CatalogModel {
    const model = this.all().find((m) => m.key === key);
    if (!model) throw new UnknownModelError(key);
    return model;
  }
}
