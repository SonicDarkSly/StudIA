import type { ProjectContext, ProjectSummary } from './project.js';

export interface ProjectRepository {
  list(): ProjectSummary[];
  context(name: string): ProjectContext;
  folders(): { name: string; path: string }[];
  add(path: string): ProjectSummary;
  remove(name: string): void;
}

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');
