import { Injectable, Logger } from '@nestjs/common';
import { mkdirSync } from 'node:fs';
import { llamaCpp } from '../../../shared/config/esm.js';
import { LLM_DIR } from '../../../shared/config/paths.js';
import type { CatalogModel } from '../domain/catalog-model.js';
import type { DownloadState, ModelDownloader } from '../domain/model-downloader.js';

@Injectable()
export class HuggingFaceDownloader implements ModelDownloader {
  private readonly logger = new Logger('Modèles');
  private readonly states = new Map<string, DownloadState & { cancel?: () => Promise<void> }>();

  state(key: string): DownloadState | undefined {
    const s = this.states.get(key);
    return s ? { running: s.running, progress: s.progress, error: s.error } : undefined;
  }

  start(model: CatalogModel): void {
    if (this.states.get(model.key)?.running) return;
    const state: DownloadState & { cancel?: () => Promise<void> } = { running: true, progress: 0 };
    this.states.set(model.key, state);
    void this.run(model, state);
  }

  async cancel(key: string): Promise<void> {
    const state = this.states.get(key);
    if (state?.running && state.cancel) await state.cancel();
  }

  private async run(
    model: CatalogModel,
    state: DownloadState & { cancel?: () => Promise<void> },
  ): Promise<void> {
    mkdirSync(LLM_DIR, { recursive: true });
    const errors: string[] = [];
    try {
      const nlc = await llamaCpp();
      for (const uri of model.uris) {
        try {
          this.logger.log(`téléchargement de ${uri}…`);
          const downloader = await nlc.createModelDownloader({
            modelUri: uri,
            dirPath: LLM_DIR,
            deleteTempFileOnCancel: true,
            onProgress: ({ totalSize, downloadedSize }: { totalSize: number; downloadedSize: number }) => {
              state.progress = totalSize > 0 ? downloadedSize / totalSize : 0;
            },
          });
          state.cancel = () => downloader.cancel();
          const path: string = await downloader.download();
          this.logger.log(`modèle prêt : ${path}`);
          state.progress = 1;
          state.running = false;
          return;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          errors.push(`${uri} : ${message}`);
          this.logger.warn(`échec ${uri} : ${message}`);
          if (/cancel|abort/i.test(message)) break;
        }
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
    state.running = false;
    state.error = errors.join(' | ') || 'Téléchargement impossible';
  }
}
