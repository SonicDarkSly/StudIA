import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import {
  AddProjectHandler,
  AddProjectsInFolderHandler,
  RemoveProjectHandler,
} from './application/commands/add-project.command.js';
import { BrowseFoldersHandler } from './application/queries/browse-folders.query.js';
import { GetProjectContextHandler } from './application/queries/get-project-context.query.js';
import { ListProjectsHandler } from './application/queries/list-projects.query.js';
import { FOLDER_BROWSER } from './domain/folder-browser.js';
import { PROJECT_REPOSITORY } from './domain/project.repository.js';
import { FileSystemFolderBrowser } from './infrastructure/file-system-folder-browser.js';
import { FileSystemProjectRepository } from './infrastructure/file-system-project.repository.js';
import { ProjectsController } from './api/projects.controller.js';

@Module({
  imports: [CqrsModule],
  controllers: [ProjectsController],
  providers: [
    { provide: PROJECT_REPOSITORY, useClass: FileSystemProjectRepository },
    { provide: FOLDER_BROWSER, useClass: FileSystemFolderBrowser },
    ListProjectsHandler,
    GetProjectContextHandler,
    BrowseFoldersHandler,
    AddProjectHandler,
    AddProjectsInFolderHandler,
    RemoveProjectHandler,
  ],
  exports: [PROJECT_REPOSITORY],
})
export class ProjectsModule {}
