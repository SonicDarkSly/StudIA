import { PoweroffOutlined } from '@ant-design/icons';
import { Alert, Button, Switch, Tooltip } from 'antd';
import { useState } from 'react';
import type { FitLevel, Generator, MachineProfile, ModelView, RuntimeStatus } from '../types';
import { fmtNumber } from '../utils/format';
import { isBlocked } from '../utils/models';
import { MachineCard } from './MachineCard';
import { ModelCard } from './ModelCard';

const FIT_RANK: Record<FitLevel, number> = { ok: 0, limite: 1, 'trop-lourd': 2 };

interface Props {
  models: ModelView[];
  generators: Generator[];
  runtime?: RuntimeStatus;
  machine?: MachineProfile;
  selected: string;
  error?: string;
  onSelect: (key: string) => void;
  onDownload: (key: string) => void;
  onCancel: (key: string) => void;
  onUnload: () => void;
  onUninstall: (key: string) => void;
}

export function ModelPanel({
  models,
  generators,
  runtime,
  machine,
  selected,
  error,
  onSelect,
  onDownload,
  onCancel,
  onUnload,
  onUninstall,
}: Props) {
  const [hideHeavy, setHideHeavy] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const loaded = models.find((m) => m.key === runtime?.loadedKey);
  const heavy = models.filter((m) => m.fit.level === 'trop-lourd').length;
  const sorted = [...models].sort((a, b) => FIT_RANK[a.fit.level] - FIT_RANK[b.fit.level]);
  const shown = hideHeavy ? sorted.filter((m) => m.fit.level !== 'trop-lourd') : sorted;

  return (
    <div>
      {error && (
        <Alert
          type="error"
          showIcon
          title="Serveur injoignable"
          description={error}
          className="block-alert"
        />
      )}
      {machine && <MachineCard machine={machine} selectedModel={models.find((m) => m.key === selected)} />}

      <div className="glass panel-box">
        <div className="section-label">En mémoire</div>
        <div className="row">
          <span className={`status-dot${runtime?.busy ? ' busy' : loaded ? ' on' : ''}`} />
          <span className="grow">
            {runtime?.loadingKey
              ? `Chargement de ${models.find((m) => m.key === runtime.loadingKey)?.label ?? runtime.loadingKey}…`
              : loaded
                ? loaded.label
                : 'Aucun modèle chargé'}
          </span>
          {loaded && (
            <Tooltip title="Libérer la mémoire maintenant">
              <Button
                size="small"
                icon={<PoweroffOutlined aria-hidden />}
                aria-label="Libérer le modèle de la mémoire"
                onClick={onUnload}
                disabled={runtime?.busy}
              />
            </Tooltip>
          )}
        </div>
        {loaded && runtime && (
          <div className="muted runtime-details">
            {runtime.totalLayers ? `${runtime.gpuLayers}/${runtime.totalLayers} couches sur le GPU · ` : ''}
            contexte max du modèle {fmtNumber(runtime.trainContextSize ?? 0)} tokens · libéré après{' '}
            {runtime.idleMinutes} min d’inactivité
          </div>
        )}
      </div>

      <div className="catalog-head">
        <div className="section-label">Catalogue ({models.length})</div>
        {heavy > 0 && (
          <span className="muted hide-heavy">
            Masquer les trop lourds ({heavy})
            <Switch
              size="small"
              checked={hideHeavy}
              onChange={setHideHeavy}
              aria-label="Masquer les modèles trop lourds"
            />
          </span>
        )}
      </div>
      <ul aria-label="Modèles du catalogue" className="catalog">
        {shown.map((m) => (
          <ModelCard
            key={m.key}
            model={m}
            generators={generators}
            selected={m.key === selected}
            expanded={expanded.has(m.key)}
            blocked={isBlocked(m, machine)}
            busy={Boolean(m.loaded && runtime?.busy)}
            onToggle={() => toggle(m.key)}
            onSelect={onSelect}
            onDownload={onDownload}
            onCancel={onCancel}
            onUninstall={onUninstall}
          />
        ))}
      </ul>
      <div className="muted note">
        Un seul modèle est chargé à la fois. Les modèles sont rangés dans <code>server/data/llm</code> ; un
        fichier déjà présent dans un projet que tu as ajouté (<code>server/data/llm</code>,{' '}
        <code>data/llm</code> ou <code>models</code>) est réutilisé sans copie. Pour ajouter un modèle au
        catalogue, éditer <code>server/models.json</code>.
      </div>
    </div>
  );
}
