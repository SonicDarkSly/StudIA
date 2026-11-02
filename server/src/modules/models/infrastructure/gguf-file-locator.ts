import { Inject, Injectable } from '@nestjs/common';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_REPOSITORY, type ProjectRepository } from '../../projects/domain/project.repository.js';
import { env } from '../../../shared/config/env.js';
import { LLM_DIR } from '../../../shared/config/paths.js';
import { expectedFileName, filePrefix, type CatalogModel } from '../domain/catalog-model.js';
import type { LocatedModel, ModelFileLocator } from '../domain/model-file-locator.js';

const MIN_MODEL_FILE_BYTES = 10_000_000;

const isModelFile = (path: string): boolean => {
  try {
    return existsSync(path) && statSync(path).size > MIN_MODEL_FILE_BYTES;
  } catch {
    return false;
  }
};

const MODEL_SUBDIRS = [join('server', 'data', 'llm'), join('data', 'llm'), 'models'];

@Injectable()
export class GgufFileLocator implements ModelFileLocator {
  constructor(@Inject(PROJECT_REPOSITORY) private readonly projects: ProjectRepository) {}

  private searchDirs(): { dir: string; owner?: string }[] {
    const dirs: { dir: string; owner?: string }[] = [{ dir: LLM_DIR }];
    for (const { name, path } of this.projects.folders()) {
      for (const sub of MODEL_SUBDIRS) {
        const dir = join(path, sub);
        if (existsSync(dir)) dirs.push({ dir, owner: name });
      }
    }
    for (const extra of env().STUDIA_EXTRA_MODEL_DIRS) dirs.push({ dir: extra, owner: extra });
    return dirs;
  }

  locate(model: CatalogModel): LocatedModel | undefined {
    const names = model.uris.map(expectedFileName).filter((n): n is string => !!n);
    const prefixes = model.uris.map(filePrefix).filter((n): n is string => !!n);
    for (const { dir, owner } of this.searchDirs()) {
      for (const name of names) {
        const path = join(dir, name);
        if (isModelFile(path)) return { path, foundIn: owner };
      }
      if (!prefixes.length) continue;
      let entries: string[];
      try {
        entries = readdirSync(dir);
      } catch {
        continue;
      }
      for (const entry of entries) {
        const lower = entry.toLowerCase();
        if (!lower.endsWith('.gguf') || !prefixes.some((p) => lower.startsWith(p))) continue;
        const path = join(dir, entry);
        if (isModelFile(path)) return { path, foundIn: owner };
      }
    }
    return undefined;
  }
}
