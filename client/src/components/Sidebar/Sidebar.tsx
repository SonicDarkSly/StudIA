import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Popconfirm } from 'antd';
import { AUTHOR } from '@/consts';
import type { ConversationSummary, Generator, GeneratorKey } from '@/types';
import { fmtDate } from '@/utils/format';
import { generatorIcon } from '@/components/icons';
import './Sidebar.css';

const MESSAGES_PER_EXCHANGE = 2;

const exchangeLabel = (messageCount: number) => {
  const exchanges = Math.ceil(messageCount / MESSAGES_PER_EXCHANGE);
  return `${exchanges} échange${exchanges > 1 ? 's' : ''}`;
};

interface Props {
  conversations: ConversationSummary[];
  activeId?: string;
  generators: Generator[];
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function Sidebar({ conversations, activeId, generators, onNew, onOpen, onDelete }: Props) {
  const label = (key: GeneratorKey) => generators.find((g) => g.key === key)?.label ?? key;
  return (
    <aside className="studia-left glass" aria-label="Conversations">
      <Button
        type="primary"
        className="neon-btn"
        icon={<PlusOutlined aria-hidden />}
        block
        size="large"
        onClick={onNew}
      >
        Nouvelle conversation
      </Button>
      <div className="section-label">Historique</div>
      <div className="conv-list">
        {conversations.length === 0 && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucune conversation enregistrée" />
        )}
        {conversations.map((c) => (
          <div key={c.id} className={`conv-item${c.id === activeId ? ' active' : ''}`}>
            <button
              type="button"
              className="plain-button conv-open stretched"
              aria-current={c.id === activeId ? 'true' : undefined}
              onClick={() => onOpen(c.id)}
            >
              <span className="conv-icon" title={label(c.generatorKey)}>
                {generatorIcon(c.generatorKey)}
              </span>
              <span className="conv-text">
                <span className="title">{c.title}</span>
                <span className="meta">
                  <span className="sr-only">{label(c.generatorKey)}, </span>
                  {fmtDate(c.updatedAt)} · {exchangeLabel(c.messageCount)}
                </span>
              </span>
            </button>
            <Popconfirm
              title="Supprimer cette conversation ?"
              okText="Supprimer"
              cancelText="Annuler"
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete(c.id);
              }}
              onCancel={(e) => e?.stopPropagation()}
            >
              <Button
                size="small"
                type="text"
                icon={<DeleteOutlined aria-hidden />}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Supprimer la conversation « ${c.title} »`}
              />
            </Popconfirm>
          </div>
        ))}
      </div>
      <div className="muted sidebar-footer">
        100 % local : les conversations restent dans <code>server/data/conversations</code>.
        <div className="credit">
          StudIA · créé par{' '}
          <a href={AUTHOR.url} target="_blank" rel="noreferrer">
            {AUTHOR.handle}
          </a>
        </div>
      </div>
    </aside>
  );
}
