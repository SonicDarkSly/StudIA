import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api';
import type { AiTarget, Mode, ProjectSummary } from '@/types';

export function useModes() {
  const [data, setData] = useState<{ modes: Mode[]; targets: AiTarget[] }>({
    modes: [],
    targets: [],
  });
  useEffect(() => {
    api
      .modes()
      .then(setData)
      .catch(() => setData({ modes: [], targets: [] }));
  }, []);
  return data;
}

const fetchProjects = () => api.projects().catch((): ProjectSummary[] => []);

export function useProjects() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchProjects().then((list) => {
      if (!active) return;
      setProjects(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setProjects(await fetchProjects());
    setLoading(false);
  }, []);

  return { projects, loading, refresh };
}
