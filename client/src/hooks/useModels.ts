import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/api';
import { message } from 'antd';
import type { MachineProfile, ModelView, RuntimeStatus } from '@/types';
import { errorMessage } from '@/utils/errors';

const ACTIVE_POLL_MS = 1500;
const IDLE_POLL_MS = 8000;

export function useModels() {
  const [models, setModels] = useState<ModelView[]>([]);
  const [runtime, setRuntime] = useState<RuntimeStatus>();
  const [machine, setMachine] = useState<MachineProfile>();
  const [error, setError] = useState<string>();
  const timer = useRef<number | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const data = await api.models();
      setModels(data.models);
      setRuntime(data.runtime);
      setMachine(data.machine);
      setError(undefined);
      return data;
    } catch (e) {
      setError(errorMessage(e));
      return undefined;
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    const loop = async () => {
      const data = await refresh();
      if (stopped) return;
      const active =
        data?.models.some((m) => m.status === 'downloading') ||
        !!data?.runtime.loadingKey ||
        data?.runtime.busy;
      timer.current = window.setTimeout(loop, active ? ACTIVE_POLL_MS : IDLE_POLL_MS);
    };
    void loop();
    return () => {
      stopped = true;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [refresh]);

  const download = useCallback(
    async (key: string) => {
      try {
        await api.download(key);
      } catch (e) {
        void message.error(errorMessage(e));
      }
      await refresh();
    },
    [refresh],
  );

  const cancel = useCallback(
    async (key: string) => {
      await api.cancelDownload(key);
      await refresh();
    },
    [refresh],
  );

  const unload = useCallback(async () => {
    await api.unload();
    await refresh();
  }, [refresh]);

  const uninstall = useCallback(
    async (key: string) => {
      try {
        await api.deleteModel(key);
        void message.success('Modèle désinstallé');
      } catch (e) {
        void message.error(errorMessage(e));
      }
      await refresh();
    },
    [refresh],
  );

  return { models, runtime, machine, error, refresh, download, cancel, unload, uninstall };
}
