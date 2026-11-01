import { DeleteOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Checkbox, Empty, Modal, Popconfirm, Spin, Tag, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { ProjectContext, ProjectSummary } from '../types';
import { AddProjectModal } from './AddProjectModal';
import { PROJECTS_CONTEXT_SHARE } from '../consts';
import { fmtNumber, percentOf } from '../utils/format';

const PREVIEW_MODAL_WIDTH = 860;

interface Props {
  projects: ProjectSummary[];
  loading: boolean;
  selected: string[];
  contextSize: number;
  onChange: (names: string[]) => void;
  onRefresh: () => void;
}

export function ProjectsPanel({ projects, loading, selected, contextSize, onChange, onRefresh }: Props) {
  const [preview, setPreview] = useState<ProjectContext>();
  const [adding, setAdding] = useState(false);
  const [sizes, setSizes] = useState<Record<string, number>>({});

  useEffect(() => {
    for (const name of selected) {
      if (sizes[name] !== undefined) continue;
      api
        .projectContext(name)
        .then((c) => setSizes((s) => ({ ...s, [name]: c.approxTokens })))
        .catch(() => undefined);
    }
  }, [selected, sizes]);

  const total = selected.reduce((sum, n) => sum + (sizes[n] ?? 0), 0);
  const budget = Math.floor(contextSize * PROJECTS_CONTEXT_SHARE);
  const toggle = (name: string, on: boolean) =>
    onChange(on ? [...selected, name] : selected.filter((n) => n !== name));

  return (
    <div>
      <div className="catalog-head">
        <div className="section-label">Projets en contexte</div>
        <span>
          <Tooltip title="Relire les projets">
            <Button
              size="small"
              type="text"
              icon={<ReloadOutlined aria-hidden />}
              aria-label="Relire les projets"
              onClick={onRefresh}
            />
          </Tooltip>
          <Button size="small" icon={<PlusOutlined aria-hidden />} onClick={() => setAdding(true)}>
            Ajouter un projet
          </Button>
        </span>
      </div>
      <div className="muted projects-intro">
        StudIA ne lit que les projets que tu ajoutes ici. Les projets cochés sont lus (en lecture seule) et
        donnés au modèle : consignes (CLAUDE.md, AGENTS.md…), README, package.json, arborescence et éléments{' '}
        <code>.claude</code> existants. Les fichiers <code>.env</code>, les clés et les dossiers{' '}
        <code>data</code> ne sont jamais lus.
      </div>
      <div className="context-budget">
        <div className="muted budget-line">
          <span>Contexte des projets ≈ {fmtNumber(total)} tokens</span>
          <span>budget ≈ {fmtNumber(budget)}</span>
        </div>
        <div className="gauge">
          <span style={{ width: `${percentOf(total, budget)}%` }} />
        </div>
        {total > budget && (
          <div className="budget-overflow">
            Au-delà du budget, le contexte sera tronqué : augmente la taille du contexte ou coche moins de
            projets.
          </div>
        )}
      </div>
      {loading && <Spin />}
      {!loading && projects.length === 0 && (
        <Empty
          description={
            <span className="muted">
              Aucun projet pour l’instant. Ajoute le dossier d’un de tes projets pour que StudIA s’inspire de
              ses conventions (facultatif).
            </span>
          }
        >
          <Button
            type="primary"
            className="neon-btn"
            icon={<PlusOutlined aria-hidden />}
            onClick={() => setAdding(true)}
          >
            Ajouter un projet
          </Button>
        </Empty>
      )}
      {projects.map((p) => (
        <div key={p.name} className={`model-card${selected.includes(p.name) ? ' selected' : ''}`}>
          <div className="name">
            <Checkbox checked={selected.includes(p.name)} onChange={(e) => toggle(p.name, e.target.checked)}>
              <b>{p.name}</b>
            </Checkbox>
            <span className="grow" />
            <Tooltip title="Voir exactement ce qui sera donné au modèle">
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined aria-hidden />}
                aria-label={`Voir le contexte envoyé au modèle pour ${p.name}`}
                onClick={async () => setPreview(await api.projectContext(p.name))}
              />
            </Tooltip>
            <Popconfirm
              title={`Retirer « ${p.name} » de StudIA ?`}
              description="Le dossier n’est pas touché : il disparaît seulement de cette liste."
              okText="Retirer"
              cancelText="Annuler"
              onConfirm={async () => {
                await api.removeProject(p.name);
                if (selected.includes(p.name)) toggle(p.name, false);
                onRefresh();
              }}
            >
              <Tooltip title="Retirer de la liste">
                <Button
                  size="small"
                  type="text"
                  icon={<DeleteOutlined aria-hidden />}
                  aria-label={`Retirer ${p.name} de la liste`}
                />
              </Tooltip>
            </Popconfirm>
          </div>
          <div className="path" title={p.path}>
            {p.path}
          </div>
          {p.description && <div className="desc project-desc">{p.description}</div>}
          <div>
            {p.stack.map((s) => (
              <Tag key={s} variant="filled" color="cyan" className="stack-tag">
                {s}
              </Tag>
            ))}
          </div>
          <div className="desc">
            {[
              p.hasClaudeMd && 'CLAUDE.md',
              p.hasAgentsMd && 'AGENTS.md',
              p.skills.length && `${p.skills.length} skill${p.skills.length > 1 ? 's' : ''}`,
              p.commands.length && `${p.commands.length} commande${p.commands.length > 1 ? 's' : ''}`,
              p.agents.length && `${p.agents.length} sous-agent${p.agents.length > 1 ? 's' : ''}`,
              p.hasHooks && 'hooks',
              p.launchers.length && `${p.launchers.length} lanceur${p.launchers.length > 1 ? 's' : ''}`,
            ]
              .filter(Boolean)
              .join(' · ') || 'Aucun élément .claude'}
          </div>
        </div>
      ))}
      <AddProjectModal open={adding} onClose={() => setAdding(false)} onAdded={onRefresh} />
      <Modal
        open={!!preview}
        onCancel={() => setPreview(undefined)}
        footer={null}
        width={PREVIEW_MODAL_WIDTH}
        title={preview ? `Contexte de ${preview.name} · ≈ ${fmtNumber(preview.approxTokens)} tokens` : ''}
      >
        <div className="code-view context-preview">{preview?.text}</div>
      </Modal>
    </div>
  );
}
