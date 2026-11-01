import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  ModelInUseError,
  ModelNotDownloadedError,
  ModelOutsideStudiaError,
} from '../../domain/catalog-model.js';
import { LANGUAGE_MODEL_RUNTIME, type LanguageModelRuntime } from '../../domain/language-model-runtime.js';
import { MODEL_CATALOG, type ModelCatalog } from '../../domain/model-catalog.js';
import { MODEL_FILE_LOCATOR, type ModelFileLocator } from '../../domain/model-file-locator.js';
import { MODEL_FILE_STORE, type ModelFileStore } from '../../domain/model-file-store.js';

export class DeleteModelCommand {
  constructor(readonly key: string) {}
}

@CommandHandler(DeleteModelCommand)
export class DeleteModelHandler implements ICommandHandler<DeleteModelCommand, void> {
  constructor(
    @Inject(MODEL_CATALOG) private readonly catalog: ModelCatalog,
    @Inject(MODEL_FILE_LOCATOR) private readonly locator: ModelFileLocator,
    @Inject(MODEL_FILE_STORE) private readonly store: ModelFileStore,
    @Inject(LANGUAGE_MODEL_RUNTIME) private readonly runtime: LanguageModelRuntime,
  ) {}

  async execute({ key }: DeleteModelCommand): Promise<void> {
    const model = this.catalog.get(key);
    const located = this.locator.locate(model);
    if (!located) throw new ModelNotDownloadedError(model.label);
    if (located.foundIn) throw new ModelOutsideStudiaError(model.label, located.foundIn);
    const runtime = this.runtime.status();
    if (runtime.loadedKey === key || runtime.loadingKey === key) {
      if (runtime.busy) throw new ModelInUseError(model.label);
      await this.runtime.unload();
    }
    await this.store.remove(located.path);
  }
}
