import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { FOLDER_BROWSER, type FolderBrowser } from '../../domain/folder-browser.js';
import type { ProjectSummary } from '../../domain/project.js';
import { PROJECT_REPOSITORY, type ProjectRepository } from '../../domain/project.repository.js';

export class AddProjectCommand {
  constructor(readonly path: string) {}
}

@CommandHandler(AddProjectCommand)
export class AddProjectHandler implements ICommandHandler<AddProjectCommand, ProjectSummary> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repository: ProjectRepository) {}

  async execute({ path }: AddProjectCommand): Promise<ProjectSummary> {
    return this.repository.add(path);
  }
}

export class AddProjectsInFolderCommand {
  constructor(readonly path: string) {}
}

@CommandHandler(AddProjectsInFolderCommand)
export class AddProjectsInFolderHandler implements ICommandHandler<
  AddProjectsInFolderCommand,
  ProjectSummary[]
> {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly repository: ProjectRepository,
    @Inject(FOLDER_BROWSER) private readonly browser: FolderBrowser,
  ) {}

  async execute({ path }: AddProjectsInFolderCommand): Promise<ProjectSummary[]> {
    const listing = this.browser.browse(path);
    const added: ProjectSummary[] = [];
    for (const entry of listing.entries.filter((e) => e.markers.length)) {
      try {
        added.push(this.repository.add(entry.path));
      } catch {}
    }
    return added;
  }
}

export class RemoveProjectCommand {
  constructor(readonly name: string) {}
}

@CommandHandler(RemoveProjectCommand)
export class RemoveProjectHandler implements ICommandHandler<RemoveProjectCommand, void> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repository: ProjectRepository) {}

  async execute({ name }: RemoveProjectCommand): Promise<void> {
    this.repository.remove(name);
  }
}
