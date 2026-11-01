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
  add(@Body() body: { path?: string }): Promise<ProjectSummary> {
    return this.commands.execute(new AddProjectCommand(body?.path ?? '')).catch(translate);
  }

  @Post('projects/import')
  addAll(@Body() body: { path?: string }): Promise<ProjectSummary[]> {
    return this.commands.execute(new AddProjectsInFolderCommand(body?.path ?? '')).catch(translate);
  }

  @Delete('projects/:name')
  async remove(@Param('name') name: string): Promise<{ removed: boolean }> {
    await this.commands.execute(new RemoveProjectCommand(name)).catch(translate);
    return { removed: true };
  }

  @Get('projects/:name/context')
  context(@Param('name') name: string): Promise<ProjectContext> {
    return this.queries.execute(new GetProjectContextQuery(name)).catch(translate);
  }

  @Get('folders')
  browse(@Query('path') path?: string): Promise<FolderListing> {
    return this.queries.execute(new BrowseFoldersQuery(path)).catch(translate);
  }
}
