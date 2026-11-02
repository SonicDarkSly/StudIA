import {
  CheckCircleFilled,
  CloudDownloadOutlined,
  DownOutlined,
  RightOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Alert, Button, Popconfirm, Progress, Space, Tag, Tooltip } from 'antd';
import type { FitLevel, Mode, ModelView } from '@/types';
import { fmtNumber, percentOf } from '@/utils/format';
import { modeIcon } from '@/components/icons';
import { UninstallModelButton } from './UninstallModelButton';
import './ModelCard.css';

const FIT_TAG: Record<FitLevel, { color: string; label: string }> = {
  ok: { color: 'green', label: 'Compatible' },
  limite: { color: 'gold', label: 'Limite' },
  'trop-lourd': { color: 'red', label: 'Trop lourd' },
};

interface Props {
  model: ModelView;
  modes: Mode[];
  selected: boolean;
  expanded: boolean;
  blocked: boolean;
  busy: boolean;
  onToggle: () => void;
  onSelect: (key: string) => void;
  onDownload: (key: string) => void;
  onCancel: (key: string) => void;
  onUninstall: (key: string) => void;
}

function ModelActions({ model: m, blocked, busy, onDownload, onCancel, onUninstall }: Props) {
  return (
    <div className="model-actions">
      {m.status === 'present' && (
        <Tag color="green" variant="filled">
          Disponible{m.foundIn ? ` (fichier de ${m.foundIn})` : ''} · {fmtNumber(m.sizeGb, 1)} Go
        </Tag>
      )}
      {m.status === 'present' && !m.foundIn && (
        <UninstallModelButton model={m} busy={busy} onUninstall={onUninstall} />
      )}
      {(m.status === 'absent' || m.status === 'error') && (
        <Space orientation="vertical" className="full-width">
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
          {m.error && <Alert type="error" title={m.error} className="small-alert" />}
        </Space>
      )}
      {m.status === 'downloading' && (
        <>
          <Progress
            aria-label={`Téléchargement de ${m.label}`}
            percent={percentOf(m.progress ?? 0, 1)}
            size="small"
            className="download-progress"
          />
          <Button size="small" icon={<StopOutlined aria-hidden />} onClick={() => onCancel(m.key)}>
            Annuler
          </Button>
        </>
      )}
      <span className="muted license">Licence {m.license}</span>
    </div>
  );
}

export function ModelCard(props: Props) {
  const { model: m, modes, selected, expanded, blocked, onToggle, onSelect } = props;
  const fit = FIT_TAG[m.fit.level];
  const installed = m.status === 'present';
  const detailId = `modele-${m.key}-detail`;

  return (
    <li
      className={`model-card${selected ? ' selected' : ''}${blocked ? ' blocked' : ''}${expanded ? ' expanded' : ''}`}
    >
      <button
        type="button"
        className="plain-button card-toggle"
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={onToggle}
      >
        <span className="name">
          {expanded ? <DownOutlined aria-hidden /> : <RightOutlined aria-hidden />}
          <span>{m.label}</span>
          {m.loaded && (
            <>
              <span className="status-dot on" title="En mémoire" aria-hidden />
              <span className="sr-only">, en mémoire</span>
            </>
          )}
          <span className="grow" />
          {selected && (
            <Tag color="green" variant="filled" icon={<CheckCircleFilled aria-hidden />}>
              Choisi
            </Tag>
          )}
          <Tag color={installed ? 'green' : fit.color} variant="filled">
            {installed ? 'Installé' : fit.label}
          </Tag>
        </span>
        <span className="family">
          {m.publisher} · {fmtNumber(m.sizeGb, 1)} Go · besoin estimé {fmtNumber(m.fit.needGb, 1)} Go
          {m.status === 'downloading' && ` · téléchargement ${percentOf(m.progress ?? 0, 1)} %`}
        </span>
      </button>
      {expanded && (
        <div id={detailId} className="card-detail">
          <span className="family">
            <b>{m.publisher}</b> · {m.family}
          </span>
          <span className="capabilities">
            {m.capabilities.map((c) => (
              <Tag key={c} variant="filled" color="purple" className="capability-tag">
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
              {modes
                .filter((g) => m.idealFor.includes(g.key))
                .map((g) => (
                  <Tag key={g.key} icon={modeIcon(g.key)} color="cyan" variant="filled">
                    {g.label}
                  </Tag>
                ))}
            </span>
          )}
          <span className="desc">{m.description}</span>
          <span className="desc pros-cons">
            <b className="pro">+</b> {m.pros}
            <br />
            <b className="con">−</b> {m.cons}
          </span>
          {m.fit.level !== 'ok' && (
            <span className={`fit-note ${m.fit.level}`}>
              {fit.label} : {m.fit.reason}
            </span>
          )}
          <div className="choose-row">
            {selected && (
              <span className="chosen-note">
                <CheckCircleFilled aria-hidden /> Modèle choisi pour cette conversation
              </span>
            )}
            {!selected && installed && (
              <Tooltip title={blocked ? m.fit.reason : undefined}>
                <Button
                  type="primary"
                  size="small"
                  className="neon-btn"
                  disabled={blocked}
                  onClick={() => onSelect(m.key)}
                >
                  Choisir ce modèle<span className="sr-only"> : {m.label}</span>
                </Button>
              </Tooltip>
            )}
            {!selected && !installed && (
              <span className="muted note">Télécharge ce modèle pour pouvoir le choisir.</span>
            )}
          </div>
          <ModelActions {...props} />
        </div>
      )}
    </li>
  );
}
