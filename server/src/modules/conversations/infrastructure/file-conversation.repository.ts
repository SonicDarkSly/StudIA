import { Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { CONVERSATIONS_DIR } from '../../../shared/config/paths.js';
import { toPrettyJson } from '../../../shared/json.js';
import {
  Conversation,
  InvalidConversationError,
  conversationInputSchema,
  type ConversationSummary,
} from '../domain/conversation.js';
import type { ConversationRepository } from '../domain/conversation.repository.js';

const MAX_CONVERSATIONS = 300;

@Injectable()
export class FileConversationRepository implements ConversationRepository {
  private path(id: string): string | undefined {
    return Conversation.isValidId(id) ? join(CONVERSATIONS_DIR, `${id}.json`) : undefined;
  }

  async save(conversation: Conversation): Promise<void> {
    await mkdir(CONVERSATIONS_DIR, { recursive: true });
    const path = this.path(conversation.id);
    if (!path)
      throw new InvalidConversationError(`Identifiant de conversation invalide : ${conversation.id}`);
    const tmp = `${path}.tmp`;
    await writeFile(tmp, toPrettyJson(conversation.snapshot()));
    await rename(tmp, path);
    await this.prune();
  }

  async findById(id: string): Promise<Conversation | undefined> {
    const path = this.path(id);
    if (!path || !existsSync(path)) return undefined;
    try {
      const parsed = conversationInputSchema.safeParse(JSON.parse(await readFile(path, 'utf8')));
      return parsed.success ? Conversation.restore(parsed.data) : undefined;
    } catch {
      return undefined;
    }
  }

  async list(): Promise<ConversationSummary[]> {
    if (!existsSync(CONVERSATIONS_DIR)) return [];
    const out: ConversationSummary[] = [];
    for (const file of await readdir(CONVERSATIONS_DIR)) {
      if (!file.endsWith('.json')) continue;
      const conversation = await this.findById(basename(file, '.json'));
      if (conversation) out.push(conversation.summary());
    }
    return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async delete(id: string): Promise<void> {
    const path = this.path(id);
    if (path && existsSync(path)) await rm(path);
  }

  async clear(): Promise<void> {
    for (const c of await this.list()) await this.delete(c.id);
  }

  private async prune(): Promise<void> {
    const all = await this.list();
    for (const c of all.slice(MAX_CONVERSATIONS)) await this.delete(c.id);
  }
}
