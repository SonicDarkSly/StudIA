import {
  ConflictException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Get,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CancelDownloadCommand,
  DownloadModelCommand,
} from '../application/commands/download-model.command.js';
import { DeleteModelCommand } from '../application/commands/delete-model.command.js';
import { UnloadModelCommand } from '../application/commands/unload-model.command.js';
import { ListModelsQuery, type ModelsOverview } from '../application/queries/list-models.query.js';
import {
  ModelInUseError,
  ModelNotDownloadedError,
  ModelOutsideStudiaError,
  UnknownModelError,
} from '../domain/catalog-model.js';
import { ModelTooLargeError } from '../domain/machine.js';
import { ZodValidationPipe } from '../../../shared/validation/zod-validation.pipe.js';
import { modelKeySchema } from './model-key.schema.js';

@Controller('api/models')
export class ModelsController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Get()
  list(): Promise<ModelsOverview> {
    return this.queries.execute(new ListModelsQuery());
  }

  @Post(':key/download')
  @HttpCode(HttpStatus.ACCEPTED)
  async download(
    @Param('key', new ZodValidationPipe(modelKeySchema)) key: string,
  ): Promise<{ started: boolean }> {
    try {
      return await this.commands.execute(new DownloadModelCommand(key));
    } catch (err) {
      if (err instanceof UnknownModelError) throw new NotFoundException(err.message);
      if (err instanceof ModelTooLargeError) throw new ConflictException(err.message);
      throw err;
    }
  }

  @Delete(':key/download')
  async cancel(
    @Param('key', new ZodValidationPipe(modelKeySchema)) key: string,
  ): Promise<{ cancelled: boolean }> {
    await this.commands.execute(new CancelDownloadCommand(key));
    return { cancelled: true };
  }

  @Delete(':key')
  async uninstall(
    @Param('key', new ZodValidationPipe(modelKeySchema)) key: string,
  ): Promise<{ deleted: boolean }> {
    try {
      await this.commands.execute(new DeleteModelCommand(key));
      return { deleted: true };
    } catch (err) {
      if (err instanceof UnknownModelError || err instanceof ModelNotDownloadedError)
        throw new NotFoundException(err.message);
      if (err instanceof ModelOutsideStudiaError || err instanceof ModelInUseError)
        throw new ConflictException(err.message);
      throw err;
    }
  }

  @Post('unload')
  async unload(): Promise<{ unloaded: boolean }> {
    await this.commands.execute(new UnloadModelCommand());
    return { unloaded: true };
  }
}
