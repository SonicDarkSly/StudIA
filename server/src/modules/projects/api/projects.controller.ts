import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  AddProjectCommand,
  AddProjectsInFolderCommand,
  RemoveProjectCommand,
} from '../application/commands/add-project.command.js';
import { BrowseFoldersQuery } from '../application/queries/browse-folders.query.js';
import { GetProjectContextQuery } from '../application/queries/get-project-context.query.js';
import { ListProjectsQuery } from '../application/queries/list-projects.query.js';
import type { FolderListing } from '../domain/folder-browser.js';
import {
  InvalidProjectFolderError,
  ProjectNotFoundError,
  type ProjectContext,
  type ProjectSummary,
} from '../domain/project.js';
import { ZodValidationPipe } from '../../../shared/validation/zod-validation.pipe.js';
import { projectNameSchema } from './project-name.schema.js';
import { folderPathSchema, projectPathSchema, type ProjectPathInput } from './project-path.schema.js';

const translate = (err: unknown): never => {
  if (err instanceof ProjectNotFoundError) throw new NotFoundException(err.message);
  if (err instanceof InvalidProjectFolderError) throw new BadRequestException(err.message);
  throw err;
};

@Controller('api')
export class ProjectsController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Get('projects')
  list(): Promise<ProjectSummary[]> {
    return this.queries.execute(new ListProjectsQuery());
  }

  @Post('projects')
  add(@Body(new ZodValidationPipe(projectPathSchema)) body: ProjectPathInput): Promise<ProjectSummary> {
    return this.commands.execute(new AddProjectCommand(body?.path ?? '')).catch(translate);
  }

  @Post('projects/import')
  addAll(@Body(new ZodValidationPipe(projectPathSchema)) body: ProjectPathInput): Promise<ProjectSummary[]> {
    return this.commands.execute(new AddProjectsInFolderCommand(body?.path ?? '')).catch(translate);
  }

  @Delete('projects/:name')
  async remove(
    @Param('name', new ZodValidationPipe(projectNameSchema)) name: string,
  ): Promise<{ removed: boolean }> {
    await this.commands.execute(new RemoveProjectCommand(name)).catch(translate);
    return { removed: true };
  }

  @Get('projects/:name/context')
  context(@Param('name', new ZodValidationPipe(projectNameSchema)) name: string): Promise<ProjectContext> {
    return this.queries.execute(new GetProjectContextQuery(name)).catch(translate);
  }

  @Get('folders')
  browse(@Query('path', new ZodValidationPipe(folderPathSchema)) path?: string): Promise<FolderListing> {
    return this.queries.execute(new BrowseFoldersQuery(path)).catch(translate);
  }
}
