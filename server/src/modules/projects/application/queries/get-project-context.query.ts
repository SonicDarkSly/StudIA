import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { ProjectContext } from '../../domain/project.js';
import { PROJECT_REPOSITORY, type ProjectRepository } from '../../domain/project.repository.js';

export class GetProjectContextQuery {
  constructor(readonly name: string) {}
}

@QueryHandler(GetProjectContextQuery)
export class GetProjectContextHandler implements IQueryHandler<GetProjectContextQuery, ProjectContext> {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly repository: ProjectRepository) {}

  async execute({ name }: GetProjectContextQuery): Promise<ProjectContext> {
    return this.repository.context(name);
  }
}
