import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { Conversation, ConversationSummary } from '../types';

const fetchConversations = () => api.conversations().catch((): ConversationSummary[] => []);

export function useConversations() {
  const [list, setList] = useState<ConversationSummary[]>([]);

  useEffect(() => {
    let active = true;
    void fetchConversations().then((conversations) => {
      if (active) setList(conversations);
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setList(await fetchConversations());
  }, []);

  const save = useCallback(
    async (c: Conversation) => {
      await api.saveConversation(c);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await api.deleteConversation(id);
      await refresh();
    },
    [refresh],
  );

  return { list, refresh, save, remove, load: api.conversation };
}
