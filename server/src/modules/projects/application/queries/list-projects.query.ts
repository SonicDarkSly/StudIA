import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { ProjectSummary } from '../../domain/project.js';
import { PROJECT_REPOSITORY, type ProjectRepository } from '../../domain/project.repository.js';

export class ListProjectsQuery {}

@QueryHandler(ListProjectsQuery)
export class ListProjectsHandler implements IQueryHandler<ListProjectsQuery, ProjectSummary[]> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repository: ProjectRepository) {}

  async execute(): Promise<ProjectSummary[]> {
    return this.repository.list();
  }
}
