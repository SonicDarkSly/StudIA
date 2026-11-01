import type {
  AiTarget,
  ChatEvent,
  ChatMessage,
  Conversation,
  ConversationSummary,
  FolderListing,
  GenerationSettings,
  Generator,
  GeneratorKey,
  MachineProfile,
  ModelView,
  ProjectContext,
  TargetKey,
  ProjectSummary,
  RuntimeStatus,
} from './types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? message);
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  models: () =>
    request<{ models: ModelView[]; runtime: RuntimeStatus; machine: MachineProfile }>('/api/models'),
  download: (key: string) => request<{ started: boolean }>(`/api/models/${key}/download`, { method: 'POST' }),
  cancelDownload: (key: string) => request(`/api/models/${key}/download`, { method: 'DELETE' }),
  unload: () => request('/api/models/unload', { method: 'POST' }),
  deleteModel: (key: string) => request<{ deleted: boolean }>(`/api/models/${key}`, { method: 'DELETE' }),
  generators: () => request<{ generators: Generator[]; targets: AiTarget[] }>('/api/generators'),
  projects: () => request<ProjectSummary[]>('/api/projects'),
  addProject: (path: string) =>
    request<ProjectSummary>('/api/projects', { method: 'POST', body: JSON.stringify({ path }) }),
  addProjectsIn: (path: string) =>
    request<ProjectSummary[]>('/api/projects/import', { method: 'POST', body: JSON.stringify({ path }) }),
  removeProject: (name: string) => request(`/api/projects/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  folders: (path?: string) =>
    request<FolderListing>(`/api/folders${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  projectContext: (name: string) =>
    request<ProjectContext>(`/api/projects/${encodeURIComponent(name)}/context`),
  conversations: () => request<ConversationSummary[]>('/api/conversations'),
  conversation: (id: string) => request<Conversation>(`/api/conversations/${id}`),
  saveConversation: (c: Conversation) =>
    request<Conversation>(`/api/conversations/${c.id}`, { method: 'PUT', body: JSON.stringify(c) }),
  deleteConversation: (id: string) => request(`/api/conversations/${id}`, { method: 'DELETE' }),
  info: () => request<{ name: string; author: string; lan: boolean; node: string }>('/api/info'),
};

interface StreamRequest {
  modelKey: string;
  generatorKey: GeneratorKey;
  targetKey: TargetKey;
  projectNames: string[];
  settings: GenerationSettings;
  extraInstructions?: string;
  messages: ChatMessage[];
}

const EVENT_SEPARATOR = '\n\n';
const DATA_PREFIX = 'data: ';

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
  if (!res.ok || !res.body) throw new Error(`Le serveur ne répond pas (${res.status}).`);
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
      try {
        const event: ChatEvent = JSON.parse(line.slice(DATA_PREFIX.length));
        onEvent(event);
      } catch {}
    }
  }
}
