import { Injectable, Logger } from '@nestjs/common';
import { realpath, rm } from 'node:fs/promises';
import { isAbsolute, relative } from 'node:path';
import { LLM_DIR } from '../../../shared/config/paths.js';
import type { ModelFileStore } from '../domain/model-file-store.js';

@Injectable()
export class GgufFileStore implements ModelFileStore {
  private readonly logger = new Logger('Modèles');

  async remove(path: string): Promise<void> {
    const file = await realpath(path);
    const fromStudia = relative(await realpath(LLM_DIR), file);
    if (!fromStudia || fromStudia.startsWith('..') || isAbsolute(fromStudia))
      throw new Error(`Suppression refusée : ${file} n'est pas dans ${LLM_DIR}.`);
    await rm(file);
    this.logger.log(`modèle désinstallé : ${file}`);
  }
}
