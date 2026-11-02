import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  FileOutlined,
  FileZipOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Alert, Button, Empty, Space, Tag, Tooltip, message as toast } from 'antd';
import { type ReactNode, useMemo, useState } from 'react';
import { DEFAULT_GENERATOR } from '@/consts';
import type { FileIssue, GeneratedFile, Generator, TargetKey } from '@/types';
import {
  archiveName,
  downloadFile,
  downloadZip,
  parseFiles,
  validateFiles,
  withScaffold,
} from '@/utils/files';
import { placePluginManifest } from '@/utils/plugins';
import { placeSkillFiles } from '@/utils/skills';
import { CodeView } from '@/components/CodeView';
import './FilesPanel.css';

const ISSUE_LEVELS: Record<FileIssue['level'], { label: string; icon: ReactNode }> = {
  error: { label: 'Erreur', icon: <CloseCircleOutlined aria-hidden className="issue-icon" /> },
  warning: { label: 'Avertissement', icon: <WarningOutlined aria-hidden className="issue-icon" /> },
  ok: { label: 'Correct', icon: <CheckCircleOutlined aria-hidden className="issue-icon" /> },
};

interface Props {
  text?: string;
  generator: Generator | undefined;
  targetKey: TargetKey;
  live: boolean;
}

export function FilesPanel({ text, generator, targetKey, live }: Props) {
  const format = generator?.formats[targetKey];
  const [extra, setExtra] = useState<GeneratedFile[]>([]);
  const parsed = useMemo(() => parseFiles(text ?? ''), [text]);
  const files = useMemo(
    () => [
      ...withScaffold(placePluginManifest(placeSkillFiles(parsed.files, format), format), [
        ...(generator?.scaffold ?? []),
        ...(format?.scaffold ?? []),
      ]),
      ...extra,
    ],
    [parsed.files, generator, format, extra],
  );
  const issues = useMemo(
    () => (live ? [] : validateFiles(generator?.key ?? DEFAULT_GENERATOR, files, format)),
    [files, generator, format, live],
  );
  const [selected, setSelected] = useState<string>();

  if (!files.length) {
    return (
      <Empty
        description={
          <span className="muted">
            Les fichiers générés apparaissent ici : aperçu, contrôles automatiques et téléchargement.
          </span>
        }
      />
    );
  }

  const current = files.find((f) => f.path === selected) ?? files[0];
  const zipName = archiveName(files);
  const claudeMd = files.find((f) => f.path === 'CLAUDE.md');
  const hasAgentsMd = files.some((f) => f.path === 'AGENTS.md');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.content);
      toast.success('Contenu copié');
    } catch {
      toast.error('Copie impossible');
    }
  };

  return (
    <div>
      {parsed.partial && (
        <Alert
          type={live ? 'info' : 'warning'}
          showIcon
          className="block-alert"
          title={
            live ? 'Écriture en cours…' : 'Le dernier fichier semble coupé (longueur maximale atteinte ?).'
          }
        />
      )}
      <Space wrap className="files-actions">
        <Button
          type="primary"
          className="neon-btn"
          icon={<FileZipOutlined aria-hidden />}
          disabled={live}
          onClick={() => downloadZip(files, zipName)}
        >
          Tout télécharger (.zip)
        </Button>
        {generator?.key === 'claudemd' && claudeMd && !hasAgentsMd && (
          <Tooltip title="AGENTS.md est lu par Codex, Cursor, Copilot… : même contenu, autre nom.">
            <Button
              onClick={() => setExtra([{ path: 'AGENTS.md', content: claudeMd.content, origin: 'gabarit' }])}
            >
              + copie AGENTS.md
            </Button>
          </Tooltip>
        )}
      </Space>

      <div className="section-label">Fichiers ({files.length})</div>
      {files.map((f) => (
        <button
          type="button"
          key={f.path}
          className={`plain-button file-tree-item${f.path === current.path ? ' active' : ''}`}
          aria-pressed={f.path === current.path}
          onClick={() => setSelected(f.path)}
        >
          <FileOutlined aria-hidden className="accent" />
          <span className="file-path">{f.path}</span>
          {f.origin === 'gabarit' && (
            <Tooltip title="Fichier ajouté par StudIA (gabarit), pas par le modèle">
              <Tag variant="filled" className="scaffold-tag">
                gabarit
              </Tag>
            </Tooltip>
          )}
        </button>
      ))}

      <div className="preview-head">
        <div className="section-label">Aperçu</div>
        <Space>
          <Tooltip title="Copier">
            <Button
              size="small"
              icon={<CopyOutlined aria-hidden />}
              aria-label="Copier le fichier"
              onClick={copy}
            />
          </Tooltip>
          <Tooltip title="Télécharger ce fichier">
            <Button
              size="small"
              icon={<DownloadOutlined aria-hidden />}
              aria-label="Télécharger le fichier"
              onClick={() => downloadFile(current)}
            />
          </Tooltip>
        </Space>
      </div>
      <CodeView label={`Aperçu de ${current.path}`}>{current.content}</CodeView>

      {!live && (
        <>
          <div className="section-label checks-label" id="controles-automatiques">
            Contrôles automatiques
          </div>
          <ul className="issues" aria-labelledby="controles-automatiques">
            {issues.map((i, idx) => {
              const level = ISSUE_LEVELS[i.level];
              return (
                <li key={idx} className={`issue ${i.level}`}>
                  {level.icon}
                  <span>
                    <span className="sr-only">{level.label} : </span>
                    {i.path && <code>{i.path}</code>} {i.message}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="muted note files-note">
            StudIA ne modifie jamais tes projets : relis les fichiers, puis copie-les toi-même à leur place
            dans le projet visé (le .zip respecte déjà l’arborescence).
            {format?.summary && (
              <>
                <br />
                <b>Où les placer :</b> {format.summary}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
