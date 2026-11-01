import { ArrowUpOutlined, FolderFilled, FolderOpenOutlined, HomeOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Modal, Space, Spin, Tag, message } from 'antd';
import { useCallback, useState } from 'react';
import { api } from '../api';
import type { FolderListing } from '../types';
import { errorMessage } from '../utils/errors';

const MAX_MARKERS_SHOWN = 3;

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function AddProjectModal({ open, onClose, onAdded }: Props) {
  const [listing, setListing] = useState<FolderListing>();
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const go = useCallback(async (target?: string) => {
    setLoading(true);
    setError(undefined);
    try {
      const l = await api.folders(target);
      setListing(l);
      setPath(l.path);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const add = async (target: string) => {
    try {
      const p = await api.addProject(target);
      void message.success(`Projet « ${p.name} » ajouté`);
      onAdded();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const addAll = async () => {
    if (!listing) return;
    try {
      const added = await api.addProjectsIn(listing.path);
      void message.success(
        added.length ? `${added.length} projet(s) ajouté(s)` : 'Aucun sous-dossier ne ressemble à un projet',
      );
      onAdded();
      if (added.length) onClose();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const projectsHere = listing?.entries.filter((e) => e.markers.length).length ?? 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      afterOpenChange={(visible) => {
        if (visible && !listing) void go();
      }}
      footer={null}
      width={720}
      title="Ajouter un projet"
    >
      <div className="muted" style={{ fontSize: 12.5, marginBottom: 10, lineHeight: 1.5 }}>
        StudIA ne lit que les projets ajoutés ici, en lecture seule. Les dossiers marqués d’une étiquette
        contiennent un repère de projet (package.json, CLAUDE.md, .git…).
      </div>
      <Space.Compact style={{ width: '100%', marginBottom: 10 }}>
        <Button
          icon={<HomeOutlined aria-hidden />}
          aria-label="Dossier personnel"
          onClick={() => void go(listing?.home)}
          title="Dossier personnel"
        />
        <Button
          icon={<ArrowUpOutlined aria-hidden />}
          disabled={!listing?.parent}
          onClick={() => void go(listing?.parent ?? undefined)}
          aria-label="Dossier parent"
          title="Dossier parent"
        />
        <Input
          aria-label="Chemin du dossier"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          onPressEnter={() => void go(path)}
          placeholder="/chemin/complet/vers/mon-projet"
        />
        <Button onClick={() => void go(path)}>Ouvrir</Button>
      </Space.Compact>
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 10 }} />}
      <div className="folder-list">
        {loading && <Spin style={{ margin: 20 }} />}
        {!loading &&
          listing?.entries.map((e) => (
            <div key={e.path} className="folder-row">
              <button
                type="button"
                className="plain-button folder-name"
                aria-label={`Ouvrir le dossier ${e.name}`}
                onClick={() => void go(e.path)}
              >
                {e.markers.length ? (
                  <FolderFilled aria-hidden style={{ color: 'var(--violet)' }} />
                ) : (
                  <FolderOpenOutlined aria-hidden />
                )}{' '}
                {e.name}
              </button>
              {e.markers.slice(0, MAX_MARKERS_SHOWN).map((m) => (
                <Tag key={m} variant="filled" color="purple" style={{ fontSize: 11 }}>
                  {m}
                </Tag>
              ))}
              <span style={{ flex: 1 }} />
              {e.markers.length > 0 && (
                <Button size="small" onClick={() => void add(e.path)}>
                  Ajouter
                </Button>
              )}
            </div>
          ))}
        {!loading && listing && listing.entries.length === 0 && (
          <div className="muted" style={{ padding: 16 }}>
            Aucun sous-dossier.
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <Button
          type="primary"
          className="neon-btn"
          disabled={!listing}
          onClick={() => listing && void add(listing.path)}
        >
          Ajouter ce dossier comme projet
        </Button>
        <Button disabled={!projectsHere} onClick={() => void addAll()}>
          Ajouter les {projectsHere} projets de ce dossier
        </Button>
      </div>
    </Modal>
  );
}
