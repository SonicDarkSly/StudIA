import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { LANGUAGE_MODEL_RUNTIME, type LanguageModelRuntime } from '../../domain/language-model-runtime.js';

export class UnloadModelCommand {}

@CommandHandler(UnloadModelCommand)
export class UnloadModelHandler implements ICommandHandler<UnloadModelCommand, void> {
  constructor(@Inject(LANGUAGE_MODEL_RUNTIME) private readonly runtime: LanguageModelRuntime) {}

  execute(): Promise<void> {
    return this.runtime.unload();
  }
}
