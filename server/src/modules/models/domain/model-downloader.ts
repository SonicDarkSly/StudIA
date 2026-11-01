import type { CatalogModel } from './catalog-model.js';

export interface DownloadState {
  running: boolean;
  progress: number;
  error?: string;
}

export interface ModelDownloader {
  state(key: string): DownloadState | undefined;
  start(model: CatalogModel): void;
  cancel(key: string): Promise<void>;
}

export const MODEL_DOWNLOADER = Symbol('MODEL_DOWNLOADER');
