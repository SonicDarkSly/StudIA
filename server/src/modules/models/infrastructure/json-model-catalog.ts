import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { MODELS_FILE } from '../../../shared/config/paths.js';
import { UnknownModelError, type CatalogModel } from '../domain/catalog-model.js';
import type { ModelCatalog } from '../domain/model-catalog.js';

@Injectable()
export class JsonModelCatalog implements ModelCatalog {
  all(): CatalogModel[] {
    const catalog: { models: CatalogModel[] } = JSON.parse(readFileSync(MODELS_FILE, 'utf8'));
    return catalog.models;
  }

  get(key: string): CatalogModel {
    const model = this.all().find((m) => m.key === key);
    if (!model) throw new UnknownModelError(key);
    return model;
  }
}
