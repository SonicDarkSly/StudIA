import {
  BulbOutlined,
  CopyOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Alert, Button, Collapse, Tag, Tooltip, message as toast } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { STOP_REASONS } from '@/consts';
import type { ChatMessage, ModelView } from '@/types';
import { stripFiles } from '@/utils/files';
import { approxTokens, fmtNumber, percentOf } from '@/utils/format';
import './Message.css';

interface Props {
  message: ChatMessage;
  live: boolean;
  isLast: boolean;
  models: ModelView[];
  onShowFiles?: () => void;
  onRegenerate?: () => void;
}

export function Message({ message, live, isLast, models, onShowFiles, onRegenerate }: Props) {
  if (message.role === 'user') {
    return (
      <div className="msg user">
        <div className="bubble">{message.content}</div>
      </div>
    );
  }

  const { prose, count } = stripFiles(message.content);
  const stats = message.stats;
  const modelLabel = models.find((m) => m.key === stats?.modelKey)?.label ?? stats?.modelKey;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success('Réponse copiée');
    } catch {
      toast.error('Copie impossible');
    }
  };

  return (
    <div className="msg assistant">
      <div className="who">
        <span className="neon-text author">StudIA</span>
        {modelLabel && <Tag variant="filled">{modelLabel}</Tag>}
      </div>
      <div className="body">
        {message.thought ? (
          <Collapse
            size="small"
            ghost
            defaultActiveKey={live ? ['t'] : []}
            items={[
              {
                key: 't',
                label: (
                  <span className="muted">
                    <BulbOutlined aria-hidden /> Réflexion du modèle (
                    {fmtNumber(approxTokens(message.thought))} tokens env.)
                  </span>
                ),
                children: <div className="thought">{message.thought}</div>,
              },
            ]}
          />
        ) : null}
        <div className="markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {prose || (live ? '' : '_(réponse vide)_')}
          </ReactMarkdown>
          {live && <span className="caret" />}
        </div>
        {message.error && (
          <Alert
            type="error"
            showIcon
            icon={<WarningOutlined aria-hidden />}
            title={message.error}
            className="top-alert"
          />
        )}
        {!live && (count > 0 || stats) && (
          <div className="stats">
            {count > 0 && onShowFiles && (
              <Button
                size="small"
                type="primary"
                className="neon-btn"
                icon={<FolderOpenOutlined aria-hidden />}
                onClick={onShowFiles}
              >
                {count} fichier{count > 1 ? 's' : ''} généré{count > 1 ? 's' : ''}
              </Button>
            )}
            {stats && (
              <>
                <span>
                  <b>{fmtNumber(stats.promptTokens)}</b> tokens lus
                </span>
                <span>
                  <b>{fmtNumber(stats.outputTokens)}</b> écrits
                </span>
                <span>
                  <b>{fmtNumber(stats.tokensPerSecond, 1)}</b> tok/s
                </span>
                {stats.firstTokenSeconds !== undefined && (
                  <Tooltip title="Temps avant le premier mot : lecture du contexte (et chargement du modèle la première fois).">
                    <span>
                      1er token <b>{fmtNumber(stats.firstTokenSeconds, 1)} s</b>
                    </span>
                  </Tooltip>
                )}
                <span>
                  total <b>{fmtNumber(stats.seconds, 1)} s</b>
                </span>
                <Tooltip title="Contexte occupé après la réponse / taille du contexte">
                  <span>
                    contexte <b>{percentOf(stats.contextUsed, stats.contextSize)} %</b>
                  </span>
                </Tooltip>
                <span>arrêt : {STOP_REASONS[stats.stopReason] ?? stats.stopReason}</span>
              </>
            )}
            <Tooltip title="Copier la réponse brute">
              <Button
                size="small"
                type="text"
                icon={<CopyOutlined aria-hidden />}
                aria-label="Copier la réponse"
                onClick={copy}
              />
            </Tooltip>
            {isLast && onRegenerate && (
              <Tooltip title="Régénérer avec les réglages actuels">
                <Button
                  size="small"
                  type="text"
                  icon={<ReloadOutlined aria-hidden />}
                  aria-label="Régénérer la réponse"
                  onClick={onRegenerate}
                />
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
