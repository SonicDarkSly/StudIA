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
import { useMemo, useState } from 'react';
import { DEFAULT_GENERATOR } from '../constants';
import type { GeneratedFile, Generator, TargetKey } from '../types';
import {
  archiveName,
  downloadFile,
  downloadZip,
  parseFiles,
  validateFiles,
  withScaffold,
} from '../utils/files';

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
      ...withScaffold(parsed.files, [...(generator?.scaffold ?? []), ...(format?.scaffold ?? [])]),
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
          style={{ marginBottom: 10 }}
          title={
            live ? 'Écriture en cours…' : 'Le dernier fichier semble coupé (longueur maximale atteinte ?).'
          }
        />
      )}
      <Space wrap style={{ marginBottom: 10 }}>
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
          <FileOutlined aria-hidden style={{ color: 'var(--cyan)' }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.path}</span>
          {f.origin === 'gabarit' && (
            <Tooltip title="Fichier ajouté par StudIA (gabarit), pas par le modèle">
              <Tag variant="filled" style={{ marginRight: 0 }}>
                gabarit
              </Tag>
            </Tooltip>
          )}
        </button>
      ))}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '12px 0 6px',
        }}
      >
        <div className="section-label" style={{ margin: 0 }}>
          Aperçu
        </div>
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
      <div className="code-view">{current.content}</div>

      {!live && (
        <>
          <div className="section-label" style={{ marginTop: 12 }}>
            Contrôles automatiques
          </div>
          {issues.map((i, idx) => (
            <div
              key={idx}
              style={{ display: 'flex', gap: 8, fontSize: 12.5, marginBottom: 6, lineHeight: 1.45 }}
            >
              {i.level === 'error' ? (
                <CloseCircleOutlined aria-hidden style={{ color: '#ff4d6d', marginTop: 3 }} />
              ) : i.level === 'warning' ? (
                <WarningOutlined aria-hidden style={{ color: '#fbbf24', marginTop: 3 }} />
              ) : (
                <CheckCircleOutlined aria-hidden style={{ color: 'var(--cyan)', marginTop: 3 }} />
              )}
              <span>
                {i.path && <code style={{ fontSize: 11 }}>{i.path}</code>} {i.message}
              </span>
            </div>
          ))}
          <div className="muted" style={{ fontSize: 11.5, marginTop: 8, lineHeight: 1.5 }}>
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
