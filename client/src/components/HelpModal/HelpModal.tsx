import { Modal, Tag } from 'antd';
import { AUTHOR } from '@/consts';
import type { AiTarget, Generator, SupportLevel } from '@/types';
import './HelpModal.css';

const HELP_MODAL_WIDTH = 780;

const CELL: Record<SupportLevel, { color: string; label: string }> = {
  natif: { color: 'green', label: 'natif' },
  adapte: { color: 'gold', label: 'adapté' },
  indisponible: { color: 'red', label: 'non' },
};

interface Props {
  open: boolean;
  onClose: () => void;
  generators: Generator[];
  targets: AiTarget[];
}

export function HelpModal({ open, onClose, generators, targets }: Props) {
  const makers = generators.filter((g) => g.usesFiles);
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={HELP_MODAL_WIDTH}
      title="Comment utiliser StudIA"
    >
      <div className="markdown">
        <p>
          <b>StudIA</b> est un assistant de conversation qui tourne <b>entièrement sur cet ordinateur</b> : le
          modèle, les conversations et la lecture de tes projets restent en local. Le seul accès internet
          possible est le téléchargement d’un modèle, quand tu le demandes.
        </p>
        <h2 className="help-title">1. Choisir l’IA cible et le mode</h2>
        <p>
          L’<b>IA cible</b> est l’outil qui utilisera les fichiers (Claude, Codex, Copilot, Cursor, Gemini
          CLI, Antigravity, ou « Multi-outils » pour les standards communs) : elle décide des dossiers et des
          formats. Le <b>mode</b> dit ce que tu fabriques : skill, connecteur MCP, commande, sous-agent,
          consignes du projet, hooks, ou discussion libre.
        </p>
        <h2 className="help-title">2. Choisir un modèle adapté à la machine</h2>
        <p>
          L’onglet <b>Modèle</b> mesure la mémoire et le processeur graphique de l’ordinateur. Chaque modèle
          est marqué <Tag color="green">Compatible</Tag>
          <Tag color="gold">Limite</Tag> ou <Tag color="red">Trop lourd</Tag> ; un modèle trop lourd ne peut
          être ni choisi ni téléchargé.
        </p>
        <h2 className="help-title">3. Donner du contexte</h2>
        <p>
          Dans <b>Projets</b>, coche les projets dont StudIA doit s’inspirer. L’œil montre exactement ce qui
          est lu ; les fichiers .env, clés et secrets ne le sont jamais.
        </p>
        <h2 className="help-title">4. Décrire, vérifier, télécharger</h2>
        <p>
          Écris comme à un collègue, puis corrige par petites touches. L’onglet <b>Fichiers</b> montre chaque
          fichier, lance des contrôles automatiques adaptés à l’IA cible et permet de tout télécharger en
          .zip. StudIA ne modifie jamais tes projets.
        </p>
        <h2 className="help-title">Compatibilité des éléments selon l’IA</h2>
        <table className="compat">
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Élément</span>
              </th>
              {targets.map((t) => (
                <th key={t.key} scope="col">
                  {t.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {makers.map((g) => (
              <tr key={g.key}>
                <th scope="row">{g.label}</th>
                {targets.map((t) => {
                  const f = g.formats[t.key];
                  const c = CELL[f.status];
                  return (
                    <td key={t.key} title={f.summary}>
                      <Tag color={c.color} variant="filled">
                        {c.label}
                      </Tag>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted help-footnote">
          « Adapté » : l’outil n’a pas ce format, StudIA livre l’équivalent le plus proche (par exemple une
          skill appelable à la place d’une commande). Survoler une case affiche l’emplacement des fichiers.
        </p>
        <h2 className="help-title">Comprendre les réglages</h2>
        <p>
          Chaque réglage (température, top-p, top-k, contexte…) est expliqué dans l’onglet <b>Réglages</b>.
          Sous chaque réponse : tokens lus et écrits, vitesse, temps avant le premier mot et part du contexte
          occupée. Astuce : fixe une graine, puis change un seul réglage et clique sur « Régénérer » pour voir
          son effet.
        </p>
        <h2 className="help-title">À propos</h2>
        <p>
          StudIA est un logiciel libre (licence {AUTHOR.license}) créé par{' '}
          <a href={AUTHOR.url} target="_blank" rel="noreferrer">
            {AUTHOR.handle}
          </a>
          . Merci de conserver cette mention dans toute copie ou version modifiée.
        </p>
      </div>
    </Modal>
  );
}
