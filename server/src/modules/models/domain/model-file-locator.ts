import type { CatalogModel } from './catalog-model.js';

export interface LocatedModel {
  path: string;
  foundIn?: string;
}

export interface ModelFileLocator {
  locate(model: CatalogModel): LocatedModel | undefined;
}

export const MODEL_FILE_LOCATOR = Symbol('MODEL_FILE_LOCATOR');
