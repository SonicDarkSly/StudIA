import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { AiTarget, Generator, ProjectSummary } from '../types';

export function useGenerators() {
  const [data, setData] = useState<{ generators: Generator[]; targets: AiTarget[] }>({
    generators: [],
    targets: [],
  });
  useEffect(() => {
    api
      .generators()
      .then(setData)
      .catch(() => setData({ generators: [], targets: [] }));
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
