import { useCallback, useRef, useState } from 'react';
import { streamChat } from '@/api';
import { DEFAULT_SETTINGS, DEFAULT_TARGET } from '@/consts';
import type {
  ChatEvent,
  ChatMessage,
  Conversation,
  GenerationSettings,
  GeneratorKey,
  StreamState,
  TargetKey,
} from '@/types';
import { errorMessage } from '@/utils/errors';
import { uid } from '@/utils/format';

const MAX_TITLE_LENGTH = 70;

export function newConversation(
  generatorKey: GeneratorKey,
  targetKey: TargetKey,
  modelKey: string,
  settings: Partial<GenerationSettings>,
  projectNames: string[] = [],
): Conversation {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: 'Nouvelle conversation',
    createdAt: now,
    updatedAt: now,
    generatorKey,
    targetKey,
    modelKey,
    projectNames,
    settings,
    systemPrompt: '',
    messages: [],
  };
}

export function useChatSession(onSaved: (c: Conversation) => Promise<void>) {
  const [conversation, setConversation] = useState<Conversation>();
  const [stream, setStream] = useState<StreamState>({ active: false });
  const abortRef = useRef<AbortController | undefined>(undefined);

  const update = useCallback((fn: (c: Conversation) => Conversation) => {
    setConversation((c) => (c ? fn(c) : c));
  }, []);

  const send = useCallback(
    async (text: string, base?: Conversation) => {
      const start = base ?? conversation;
      if (!start || !text.trim() || abortRef.current) return;
      const userMsg: ChatMessage = {
        role: 'user',
        content: text.trim(),
        createdAt: new Date().toISOString(),
      };
      const assistant: ChatMessage = {
        role: 'assistant',
        content: '',
        thought: '',
        createdAt: new Date().toISOString(),
      };
      const title = start.messages.length
        ? start.title
        : text.trim().replace(/\s+/g, ' ').slice(0, MAX_TITLE_LENGTH);
      let working: Conversation = {
        ...start,
        title,
        updatedAt: new Date().toISOString(),
        messages: [...start.messages, userMsg, assistant],
      };
      setConversation(working);
      const abort = new AbortController();
      abortRef.current = abort;
      setStream({ active: true, phase: 'reading' });

      const patchLast = (fn: (m: ChatMessage) => ChatMessage) => {
        const msgs = [...working.messages];
        msgs[msgs.length - 1] = fn(msgs[msgs.length - 1]);
        working = { ...working, messages: msgs };
        setConversation(working);
      };

      const onEvent = (e: ChatEvent) => {
        switch (e.type) {
          case 'status':
            setStream((s) => ({ ...s, phase: e.phase, detail: e.detail }));
            break;
          case 'thought':
            patchLast((m) => ({ ...m, thought: (m.thought ?? '') + e.text }));
            break;
          case 'text':
            patchLast((m) => ({ ...m, content: m.content + e.text }));
            break;
          case 'done':
            patchLast((m) => ({ ...m, stats: e.stats }));
            setStream((s) => ({ ...s, systemTokens: e.systemTokens }));
            break;
          case 'error':
            patchLast((m) => ({ ...m, error: e.message }));
            break;
        }
      };

      try {
        await streamChat(
          {
            modelKey: working.modelKey,
            generatorKey: working.generatorKey,
            targetKey: working.targetKey ?? DEFAULT_TARGET,
            projectNames: working.projectNames,
            settings: { ...DEFAULT_SETTINGS, ...working.settings },
            extraInstructions: working.systemPrompt,
            messages: working.messages.slice(0, -1).map(({ role, content }) => ({ role, content })),
          },
          onEvent,
          abort.signal,
        );
      } catch (err) {
        if (!abort.signal.aborted) patchLast((m) => ({ ...m, error: errorMessage(err) }));
      } finally {
        abortRef.current = undefined;
        const failed = Boolean(working.messages[working.messages.length - 1]?.error);
        const announcement = abort.signal.aborted
          ? 'Génération arrêtée.'
          : failed
            ? 'La génération a échoué.'
            : 'Réponse terminée.';
        setStream((s) => ({ ...s, active: false, phase: undefined, announcement }));
        working = { ...working, updatedAt: new Date().toISOString() };
        setConversation(working);
        try {
          await onSaved(working);
        } catch {}
      }
    },
    [conversation, onSaved],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const regenerate = useCallback(async () => {
    if (!conversation || abortRef.current) return;
    const msgs = [...conversation.messages];
    if (msgs[msgs.length - 1]?.role === 'assistant') msgs.pop();
    const lastUser = msgs.pop();
    if (!lastUser || lastUser.role !== 'user') return;
    await send(lastUser.content, { ...conversation, messages: msgs });
  }, [conversation, send]);

  return { conversation, setConversation, update, stream, send, stop, regenerate };
}
