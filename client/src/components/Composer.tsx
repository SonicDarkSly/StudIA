import { ArrowUpOutlined, FolderOutlined, LoadingOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Input, Space, Tag, Tooltip } from 'antd';
import { useState } from 'react';
import { DEFAULT_GENERATOR, PHASES } from '../consts';
import type {
  AiTarget,
  Conversation,
  Generator,
  ModelView,
  PanelTab,
  StreamState,
  TargetKey,
} from '../types';
import { generatorIcon } from './icons';

const COMPOSER_ROWS = { minRows: 2, maxRows: 10 };

interface Props {
  conversation: Conversation;
  generator?: Generator;
  target?: AiTarget;
  targetKey: TargetKey;
  model?: ModelView;
  stream: StreamState;
  cannotSend: boolean;
  draft: string;
  onDraftChange: (draft: string) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  onOpenPanel: (tab: PanelTab) => void;
}

export function Composer(props: Props) {
  const { conversation, generator, target, targetKey, model, stream, cannotSend, draft } = props;
  const [focus, setFocus] = useState(false);

  const submit = () => {
    if (!draft.trim() || stream.active || cannotSend) return;
    props.onSend(draft);
    props.onDraftChange('');
  };

  return (
    <div className={`composer${stream.active ? ' live' : focus ? ' focus' : ''}`}>
      <div className="composer-inner">
        <Input.TextArea
          aria-label="Message pour le modèle"
          aria-describedby="consigne-envoi"
          value={draft}
          onChange={(e) => props.onDraftChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          autoSize={COMPOSER_ROWS}
          placeholder={
            generator?.key === DEFAULT_GENERATOR
              ? 'Écris comme à un collègue : contexte, objectif, format attendu…'
              : `Décris ${generator?.label.toLowerCase() ?? 'ce que tu veux'} : à quoi ça sert, quand l’utiliser, ce que ça doit produire…`
          }
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <span id="consigne-envoi" className="sr-only">
          Entrée pour envoyer, Majuscule et Entrée pour aller à la ligne.
        </span>
        <div className="composer-bar">
          <button
            type="button"
            className="plain-button tag-button"
            onClick={() => props.onOpenPanel('settings')}
          >
            <Tag variant="filled" color="purple" icon={generatorIcon(conversation.generatorKey)}>
              {generator?.label ?? 'Discussion'}
            </Tag>
            <span className="sr-only">, changer de mode</span>
          </button>
          {generator?.usesFiles !== false && (
            <Tooltip title={`IA cible : ${target?.tools ?? ''}`}>
              <button
                type="button"
                className="plain-button tag-button"
                onClick={() => props.onOpenPanel('settings')}
              >
                <Tag variant="filled" color="geekblue">
                  pour {target?.label ?? targetKey}
                </Tag>
                <span className="sr-only">, changer d’IA cible</span>
              </button>
            </Tooltip>
          )}
          <Tooltip title="Changer de modèle">
            <button
              type="button"
              className="plain-button tag-button"
              onClick={() => props.onOpenPanel('model')}
            >
              <Tag variant="filled" color="cyan">
                {model?.label ?? conversation.modelKey}
              </Tag>
              <span className="sr-only">, changer de modèle</span>
            </button>
          </Tooltip>
          <Tooltip title="Projets donnés en contexte">
            <button
              type="button"
              className="plain-button tag-button"
              onClick={() => props.onOpenPanel('projects')}
            >
              <Tag variant="filled" icon={<FolderOutlined aria-hidden />}>
                {conversation.projectNames.length ? conversation.projectNames.join(', ') : 'aucun projet'}
              </Tag>
              <span className="sr-only">, choisir les projets</span>
            </button>
          </Tooltip>
          <span className="grow" />
          {stream.active && (
            <span className="muted phase" aria-hidden>
              <LoadingOutlined aria-hidden /> {stream.phase ? PHASES[stream.phase] : 'En cours…'}
              {stream.detail ? ` (${stream.detail})` : ''}
            </span>
          )}
          <span className="sr-only" role="status">
            {stream.active
              ? stream.phase
                ? PHASES[stream.phase]
                : 'En cours…'
              : (stream.announcement ?? '')}
          </span>
          <Space>
            {stream.active ? (
              <Button danger icon={<StopOutlined aria-hidden />} onClick={props.onStop}>
                Arrêter
              </Button>
            ) : (
              <Tooltip title="Envoyer (Entrée) · nouvelle ligne : Maj + Entrée">
                <Button
                  type="primary"
                  className="neon-btn"
                  shape="circle"
                  size="large"
                  icon={<ArrowUpOutlined aria-hidden />}
                  aria-label="Envoyer le message"
                  disabled={!draft.trim() || cannotSend}
                  onClick={submit}
                />
              </Tooltip>
            )}
          </Space>
        </div>
      </div>
    </div>
  );
}
