import { CheckCircleFilled, CloudDownloadOutlined, PoweroffOutlined, StopOutlined } from '@ant-design/icons';
import { Alert, Button, Popconfirm, Progress, Space, Switch, Tag, Tooltip } from 'antd';
import { useState } from 'react';
import type { FitLevel, Generator, MachineProfile, ModelView, RuntimeStatus } from '../types';
import { fmtNumber, percentOf } from '../utils/format';
import { isBlocked } from '../utils/models';
import { generatorIcon } from './icons';
import { MachineCard } from './MachineCard';
import { UninstallModelButton } from './UninstallModelButton';

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

const FIT_TAG: Record<FitLevel, { color: string; label: string }> = {
  ok: { color: 'green', label: 'Compatible' },
  limite: { color: 'gold', label: 'Limite' },
  'trop-lourd': { color: 'red', label: 'Trop lourd' },
};

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
  const loaded = models.find((m) => m.key === runtime?.loadedKey);
  const heavy = models.filter((m) => m.fit.level === 'trop-lourd').length;
  const rank: Record<FitLevel, number> = { ok: 0, limite: 1, 'trop-lourd': 2 };
  const sorted = [...models].sort((a, b) => rank[a.fit.level] - rank[b.fit.level]);
  const shown = hideHeavy ? sorted.filter((m) => m.fit.level !== 'trop-lourd') : sorted;

  return (
    <div>
      {error && (
        <Alert
          type="error"
          showIcon
          title="Serveur injoignable"
          description={error}
          style={{ marginBottom: 10 }}
        />
      )}
      {machine && <MachineCard machine={machine} />}

      <div className="glass" style={{ padding: 12, marginBottom: 12, borderRadius: 14 }}>
        <div className="section-label">En mémoire</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`status-dot${runtime?.busy ? ' busy' : loaded ? ' on' : ''}`} />
          <span style={{ flex: 1 }}>
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
          <div className="muted" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
            {runtime.totalLayers ? `${runtime.gpuLayers}/${runtime.totalLayers} couches sur le GPU · ` : ''}
            contexte max du modèle {fmtNumber(runtime.trainContextSize ?? 0)} tokens · libéré après{' '}
            {runtime.idleMinutes} min d’inactivité
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-label" style={{ margin: 0 }}>
          Catalogue ({models.length})
        </div>
        {heavy > 0 && (
          <span className="muted" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
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
      <div style={{ height: 8 }} />
      <div role="radiogroup" aria-label="Modèles du catalogue">
        {shown.map((m) => {
          const blocked = isBlocked(m, machine);
          const fit = FIT_TAG[m.fit.level];
          const installed = m.status === 'present';
          return (
            <div
              key={m.key}
              className={`model-card${m.key === selected ? ' selected' : ''}${blocked ? ' blocked' : ''}`}
            >
              <label className="card-select">
                <input
                  type="radio"
                  className="sr-only"
                  name="modele"
                  value={m.key}
                  checked={m.key === selected}
                  disabled={blocked}
                  aria-labelledby={`modele-${m.key}-nom`}
                  aria-describedby={`modele-${m.key}-etat`}
                  onChange={() => onSelect(m.key)}
                />
                <span className="name">
                  {m.key === selected && <CheckCircleFilled aria-hidden style={{ color: 'var(--violet)' }} />}
                  <span id={`modele-${m.key}-nom`}>{m.label}</span>
                  {m.loaded && (
                    <>
                      <span className="status-dot on" title="En mémoire" aria-hidden />
                      <span className="sr-only">en mémoire</span>
                    </>
                  )}
                  <span style={{ flex: 1 }} />
                  <Tooltip title={`Besoin estimé : ${fmtNumber(m.fit.needGb, 1)} Go · ${m.fit.reason}`}>
                    <Tag
                      id={`modele-${m.key}-etat`}
                      color={installed ? 'green' : fit.color}
                      variant="filled"
                      style={{ marginRight: 0 }}
                    >
                      {installed ? 'Installé' : fit.label}
                    </Tag>
                  </Tooltip>
                </span>
                <span className="family">
                  <b>{m.publisher}</b> · {m.family}
                </span>
                <span style={{ margin: '6px 0' }}>
                  {m.capabilities.map((c) => (
                    <Tag key={c} variant="filled" color="purple" style={{ marginBottom: 4 }}>
                      {c}
                    </Tag>
                  ))}
                  {m.thinking && (
                    <Tag variant="filled" color="magenta">
                      {m.thinkingAlways ? 'Réflexion permanente' : 'Réflexion activable'}
                    </Tag>
                  )}
                </span>
                {m.idealFor.length > 0 && (
                  <span className="ideal-for">
                    <span className="muted">Idéal pour :</span>
                    {generators
                      .filter((g) => m.idealFor.includes(g.key))
                      .map((g) => (
                        <Tag key={g.key} icon={generatorIcon(g.key)} color="cyan" variant="filled">
                          {g.label}
                        </Tag>
                      ))}
                  </span>
                )}
                <span className="desc">{m.description}</span>
                <span className="desc" style={{ marginTop: 4 }}>
                  <b style={{ color: 'var(--cyan)' }}>+</b> {m.pros}
                  <br />
                  <b style={{ color: 'var(--magenta)' }}>−</b> {m.cons}
                </span>
                {m.fit.level !== 'ok' && (
                  <span className={`fit-note ${m.fit.level}`}>
                    {fit.label} : {m.fit.reason}
                  </span>
                )}
              </label>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {m.status === 'present' && (
                  <Tag color="green" variant="filled">
                    Disponible{m.foundIn ? ` (fichier de ${m.foundIn})` : ''} · {fmtNumber(m.sizeGb, 1)} Go
                  </Tag>
                )}
                {m.status === 'present' && !m.foundIn && (
                  <UninstallModelButton
                    model={m}
                    busy={Boolean(m.loaded && runtime?.busy)}
                    onUninstall={onUninstall}
                  />
                )}
                {(m.status === 'absent' || m.status === 'error') && (
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    {blocked ? (
                      <Tooltip title={m.fit.reason}>
                        <Button size="small" icon={<CloudDownloadOutlined aria-hidden />} disabled>
                          Trop lourd pour cette machine ({fmtNumber(m.sizeGb, 1)} Go)
                        </Button>
                      </Tooltip>
                    ) : (
                      <Popconfirm
                        title={`Télécharger ${m.label} ?`}
                        description={`Environ ${fmtNumber(m.sizeGb, 1)} Go depuis Hugging Face (seul accès internet de StudIA). Licence : ${m.license}.`}
                        okText="Télécharger"
                        cancelText="Annuler"
                        onConfirm={() => onDownload(m.key)}
                      >
                        <Button size="small" icon={<CloudDownloadOutlined aria-hidden />}>
                          Télécharger ({fmtNumber(m.sizeGb, 1)} Go)
                        </Button>
                      </Popconfirm>
                    )}
                    {m.error && <Alert type="error" title={m.error} style={{ fontSize: 12 }} />}
                  </Space>
                )}
                {m.status === 'downloading' && (
                  <>
                    <Progress
                      aria-label={`Téléchargement de ${m.label}`}
                      percent={percentOf(m.progress ?? 0, 1)}
                      size="small"
                      style={{ flex: 1, margin: 0 }}
                    />
                    <Button size="small" icon={<StopOutlined aria-hidden />} onClick={() => onCancel(m.key)}>
                      Annuler
                    </Button>
                  </>
                )}
                <span className="muted" style={{ fontSize: 11 }}>
                  Licence {m.license}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
        Un seul modèle est chargé à la fois. Les modèles sont rangés dans <code>server/data/llm</code> ; un
        fichier déjà présent dans un projet que tu as ajouté (<code>server/data/llm</code>,{' '}
        <code>data/llm</code> ou <code>models</code>) est réutilisé sans copie. Pour ajouter un modèle au
        catalogue, éditer <code>server/models.json</code>.
      </div>
    </div>
  );
}
