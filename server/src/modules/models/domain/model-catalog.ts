import type { CatalogModel } from './catalog-model.js';

export interface ModelCatalog {
  all(): CatalogModel[];
  get(key: string): CatalogModel;
}

export const MODEL_CATALOG = Symbol('MODEL_CATALOG');
