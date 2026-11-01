import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import {
  CancelDownloadHandler,
  DownloadModelHandler,
} from './application/commands/download-model.command.js';
import { DeleteModelHandler } from './application/commands/delete-model.command.js';
import { UnloadModelHandler } from './application/commands/unload-model.command.js';
import { ListModelsHandler } from './application/queries/list-models.query.js';
import { LANGUAGE_MODEL_RUNTIME } from './domain/language-model-runtime.js';
import { MACHINE_PROBE } from './domain/machine.js';
import { MODEL_CATALOG } from './domain/model-catalog.js';
import { MODEL_DOWNLOADER } from './domain/model-downloader.js';
import { MODEL_FILE_LOCATOR } from './domain/model-file-locator.js';
import { MODEL_FILE_STORE } from './domain/model-file-store.js';
import { GgufFileLocator } from './infrastructure/gguf-file-locator.js';
import { GgufFileStore } from './infrastructure/gguf-file-store.js';
import { HuggingFaceDownloader } from './infrastructure/hugging-face-downloader.js';
import { JsonModelCatalog } from './infrastructure/json-model-catalog.js';
import { LlamaRuntime } from './infrastructure/llama-runtime.js';
import { NodeMachineProbe } from './infrastructure/node-machine-probe.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { ModelsController } from './api/models.controller.js';

@Module({
  imports: [CqrsModule, ProjectsModule],
  controllers: [ModelsController],
  providers: [
    { provide: MODEL_CATALOG, useClass: JsonModelCatalog },
    { provide: MODEL_FILE_LOCATOR, useClass: GgufFileLocator },
    { provide: MODEL_FILE_STORE, useClass: GgufFileStore },
    { provide: MODEL_DOWNLOADER, useClass: HuggingFaceDownloader },
    { provide: LANGUAGE_MODEL_RUNTIME, useClass: LlamaRuntime },
    { provide: MACHINE_PROBE, useClass: NodeMachineProbe },
    ListModelsHandler,
    DownloadModelHandler,
    CancelDownloadHandler,
    UnloadModelHandler,
    DeleteModelHandler,
  ],
  exports: [MODEL_CATALOG, MODEL_FILE_LOCATOR, LANGUAGE_MODEL_RUNTIME, MACHINE_PROBE],
})
export class ModelsModule {}
