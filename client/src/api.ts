import type { ChatMessage, Conversation, GenerationSettings, ModeKey, TargetKey, ChatEvent } from './types';
import { z } from '@/utils/zod';
import {
  acknowledgedSchema,
  chatEventSchema,
  conversationSchema,
  conversationSummariesSchema,
  deletedSchema,
  downloadStartedSchema,
  errorBodySchema,
  folderListingSchema,
  infoSchema,
  modelsResponseSchema,
  modesResponseSchema,
  projectContextSchema,
  projectSchema,
  projectsSchema,
} from './api.schema';

async function responseError(res: Response): Promise<Error> {
  const fallback = `${res.status} ${res.statusText}`;
  try {
    const body = errorBodySchema.safeParse(await res.json());
    const message = body.success ? body.data.message : undefined;
    return new Error(Array.isArray(message) ? message.join(', ') : (message ?? fallback));
  } catch {
    return new Error(fallback);
  }
}

async function request<T>(url: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw await responseError(res);
  const result = schema.safeParse(await res.json());
  if (!result.success)
    throw new Error(`Réponse inattendue du serveur (${url}). ${z.prettifyError(result.error)}`);
  return result.data;
}

const send = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export const api = {
  models: () => request('/api/models', modelsResponseSchema),
  download: (key: string) => request(`/api/models/${key}/download`, downloadStartedSchema, send('POST')),
  cancelDownload: (key: string) => request(`/api/models/${key}/download`, acknowledgedSchema, send('DELETE')),
  unload: () => request('/api/models/unload', acknowledgedSchema, send('POST')),
  deleteModel: (key: string) => request(`/api/models/${key}`, deletedSchema, send('DELETE')),
  modes: () => request('/api/modes', modesResponseSchema),
  projects: () => request('/api/projects', projectsSchema),
  addProject: (path: string) => request('/api/projects', projectSchema, send('POST', { path })),
  addProjectsIn: (path: string) => request('/api/projects/import', projectsSchema, send('POST', { path })),
  removeProject: (name: string) =>
    request(`/api/projects/${encodeURIComponent(name)}`, acknowledgedSchema, send('DELETE')),
  folders: (path?: string) =>
    request(`/api/folders${path ? `?path=${encodeURIComponent(path)}` : ''}`, folderListingSchema),
  projectContext: (name: string) =>
    request(`/api/projects/${encodeURIComponent(name)}/context`, projectContextSchema),
  conversations: () => request('/api/conversations', conversationSummariesSchema),
  conversation: (id: string) => request(`/api/conversations/${id}`, conversationSchema),
  saveConversation: (c: Conversation) =>
    request(`/api/conversations/${c.id}`, conversationSchema, send('PUT', c)),
  deleteConversation: (id: string) => request(`/api/conversations/${id}`, acknowledgedSchema, send('DELETE')),
  info: () => request('/api/info', infoSchema),
};

interface StreamRequest {
  modelKey: string;
  modeKey: ModeKey;
  targetKey: TargetKey;
  projectNames: string[];
  settings: GenerationSettings;
  extraInstructions?: string;
  messages: ChatMessage[];
}

const EVENT_SEPARATOR = '\n\n';
const DATA_PREFIX = 'data: ';

function parseEvent(data: string): ChatEvent | undefined {
  try {
    const result = chatEventSchema.safeParse(JSON.parse(data));
    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}

export async function streamChat(
  body: StreamRequest,
  onEvent: (event: ChatEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw await responseError(res);
  if (!res.body) throw new Error(`Le serveur ne répond pas (${res.status}).`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf(EVENT_SEPARATOR)) >= 0) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + EVENT_SEPARATOR.length);
      const line = chunk.split('\n').find((l) => l.startsWith(DATA_PREFIX));
      if (!line) continue;
      const event = parseEvent(line.slice(DATA_PREFIX.length));
      if (event) onEvent(event);
    }
  }
}
