import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { ModelView } from '../../domain/catalog-model.js';
import {
  LANGUAGE_MODEL_RUNTIME,
  type LanguageModelRuntime,
  type RuntimeStatus,
} from '../../domain/language-model-runtime.js';
import { assessFit, MACHINE_PROBE, type MachineProbe, type MachineProfile } from '../../domain/machine.js';
import { MODEL_CATALOG, type ModelCatalog } from '../../domain/model-catalog.js';
import { MODEL_DOWNLOADER, type ModelDownloader } from '../../domain/model-downloader.js';
import { MODEL_FILE_LOCATOR, type ModelFileLocator } from '../../domain/model-file-locator.js';

export class ListModelsQuery {}

export interface ModelsOverview {
  models: ModelView[];
  runtime: RuntimeStatus;
  machine: MachineProfile;
}

@QueryHandler(ListModelsQuery)
export class ListModelsHandler implements IQueryHandler<ListModelsQuery, ModelsOverview> {
  constructor(
    @Inject(MODEL_CATALOG) private readonly catalog: ModelCatalog,
    @Inject(MODEL_FILE_LOCATOR) private readonly locator: ModelFileLocator,
    @Inject(MODEL_DOWNLOADER) private readonly downloader: ModelDownloader,
    @Inject(LANGUAGE_MODEL_RUNTIME) private readonly runtime: LanguageModelRuntime,
    @Inject(MACHINE_PROBE) private readonly machine: MachineProbe,
  ) {}

  async execute(): Promise<ModelsOverview> {
    const runtime = this.runtime.status();
    const machine = await this.machine.profile();
    const models = this.catalog.all().map(({ uris: _uris, ...m }) => {
      const located = this.locator.locate({ ...m, uris: _uris });
      const dl = this.downloader.state(m.key);
      const status: ModelView['status'] = dl?.running
        ? 'downloading'
        : located
          ? 'present'
          : dl?.error
            ? 'error'
            : 'absent';
      return {
        ...m,
        status,
        foundIn: located?.foundIn,
        progress: dl?.running ? dl.progress : undefined,
        error: !located && dl?.error ? dl.error : undefined,
        loaded: runtime.loadedKey === m.key,
        fit: assessFit(m, machine),
      };
    });
    return { models, runtime, machine };
  }
}
