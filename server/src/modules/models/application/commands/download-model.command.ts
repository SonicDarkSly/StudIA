import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { assessFit, MACHINE_PROBE, ModelTooLargeError, type MachineProbe } from '../../domain/machine.js';
import { MODEL_CATALOG, type ModelCatalog } from '../../domain/model-catalog.js';
import { MODEL_DOWNLOADER, type ModelDownloader } from '../../domain/model-downloader.js';
import { MODEL_FILE_LOCATOR, type ModelFileLocator } from '../../domain/model-file-locator.js';

export class DownloadModelCommand {
  constructor(readonly key: string) {}
}

@CommandHandler(DownloadModelCommand)
export class DownloadModelHandler implements ICommandHandler<DownloadModelCommand, { started: boolean }> {
  constructor(
    @Inject(MODEL_CATALOG) private readonly catalog: ModelCatalog,
    @Inject(MODEL_FILE_LOCATOR) private readonly locator: ModelFileLocator,
    @Inject(MODEL_DOWNLOADER) private readonly downloader: ModelDownloader,
    @Inject(MACHINE_PROBE) private readonly machine: MachineProbe,
  ) {}

  async execute({ key }: DownloadModelCommand): Promise<{ started: boolean }> {
    const model = this.catalog.get(key);
    if (this.locator.locate(model)) return { started: false };
    const machine = await this.machine.profile();
    const fit = assessFit(model, machine);
    if (fit.level === 'trop-lourd' && !machine.limitsIgnored) throw new ModelTooLargeError(model.label, fit);
    this.downloader.start(model);
    return { started: true };
  }
}

export class CancelDownloadCommand {
  constructor(readonly key: string) {}
}

@CommandHandler(CancelDownloadCommand)
export class CancelDownloadHandler implements ICommandHandler<CancelDownloadCommand, void> {
  constructor(@Inject(MODEL_DOWNLOADER) private readonly downloader: ModelDownloader) {}

  execute({ key }: CancelDownloadCommand): Promise<void> {
    return this.downloader.cancel(key);
  }
}
