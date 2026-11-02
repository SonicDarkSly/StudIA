import { Alert, Button, Segmented, Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';
import type {
  AiTarget,
  Conversation,
  Generator,
  GeneratorKey,
  MachineProfile,
  ModelView,
  PanelTab,
  StreamState,
  TargetKey,
} from '@/types';
import { DEFAULT_TARGET, TARGET_NOT_USED } from '@/consts';
import { isBlocked } from '@/utils/models';
import { generatorIcon } from '@/components/icons';
import { Composer } from './Composer';
import { Message } from './Message';
import './ChatView.css';

const STICK_TO_BOTTOM_PX = 80;
const SCROLL_UP_KEYS = ['ArrowUp', 'PageUp', 'Home'];

interface Props {
  conversation: Conversation;
  generators: Generator[];
  targets: AiTarget[];
  models: ModelView[];
  machine?: MachineProfile;
  stream: StreamState;
  onPickTarget: (key: TargetKey) => void;
  onPickGenerator: (key: GeneratorKey) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  onRegenerate: () => void;
  onShowFiles: (index: number) => void;
  onOpenPanel: (tab: PanelTab) => void;
}

export function ChatView(props: Props) {
  const { conversation, generators, targets, models, stream } = props;
  const [draft, setDraft] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const generator = generators.find((g) => g.key === conversation.generatorKey);
  const targetApplies = generator?.usesFiles !== false;
  const model = models.find((m) => m.key === conversation.modelKey);
  const empty = conversation.messages.length === 0;
  const targetKey: TargetKey = conversation.targetKey ?? DEFAULT_TARGET;
  const target = targets.find((t) => t.key === targetKey);
  const format = generator?.formats[targetKey];
  const unavailable = format?.status === 'indisponible';
  const tooHeavy = isBlocked(model, props.machine);
  const modelMissing = model && model.status !== 'present';
  const needsProject = generator?.needsProject && conversation.projectNames.length === 0;
  const cannotSend = !!modelMissing || tooHeavy || unavailable;

  const stickToBottom = useRef(true);
  const lastScrollTop = useRef(0);
  const followed = useRef({ id: conversation.id, count: conversation.messages.length });

  const trackScroll = () => {
    const el = scroller.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < STICK_TO_BOTTOM_PX) stickToBottom.current = true;
    else if (el.scrollTop < lastScrollTop.current) stickToBottom.current = false;
    lastScrollTop.current = el.scrollTop;
  };

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const release = () => {
      stickToBottom.current = false;
    };
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) release();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (SCROLL_UP_KEYS.includes(event.key)) release();
    };
    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('touchmove', release, { passive: true });
    el.addEventListener('keydown', onKeyDown);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchmove', release);
      el.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const count = conversation.messages.length;
    const previous = followed.current;
    if (previous.id !== conversation.id || count > previous.count) stickToBottom.current = true;
    followed.current = { id: conversation.id, count };
    if (!count) el.scrollTop = 0;
    else if (stickToBottom.current) el.scrollTop = el.scrollHeight;
    lastScrollTop.current = el.scrollTop;
  }, [conversation.id, conversation.messages]);

  return (
    <main id="contenu" className="studia-center glass" tabIndex={-1} aria-label="Conversation">
      <div className="chat-scroll" ref={scroller} onScroll={trackScroll}>
        <div className="chat-inner">
          {empty ? (
            <div className="welcome">
              <div className="section-label">Studio IA 100 % local</div>
              <h2>
                Que fabrique-t-on <span className="neon-text">aujourd’hui</span> ?
              </h2>
              <p className="lead">
                Choisis ce que tu veux créer. StudIA s’appuie sur tes projets pour proposer des fichiers prêts
                à télécharger : rien ne quitte cet ordinateur.
              </p>
              <div className="target-picker">
                <span className="label">Pour quelle IA ?</span>
                <Segmented<TargetKey>
                  value={targetKey}
                  disabled={!targetApplies}
                  aria-describedby={targetApplies ? undefined : 'ia-sans-effet'}
                  onChange={props.onPickTarget}
                  options={targets.map((t) => ({
                    value: t.key,
                    label: (
                      <Tooltip title={`${t.vendor} · ${t.tools}. ${t.description}`}>
                        <span>{t.label}</span>
                      </Tooltip>
                    ),
                  }))}
                />
                {!targetApplies && (
                  <p id="ia-sans-effet" className="muted target-note">
                    {TARGET_NOT_USED}
                  </p>
                )}
              </div>
              <div className="mode-grid">
                {generators.map((g) => {
                  const f = g.formats[targetKey];
                  const off = f?.status === 'indisponible';
                  return (
                    <Tooltip key={g.key} title={f?.summary}>
                      <button
                        type="button"
                        className={`plain-button mode-card${g.key === conversation.generatorKey ? ' active' : ''}${off ? ' unavailable' : ''}`}
                        aria-pressed={g.key === conversation.generatorKey}
                        disabled={off}
                        onClick={() => props.onPickGenerator(g.key)}
                      >
                        <span className="icon">{generatorIcon(g.key)}</span>
                        <span className="name">{g.label}</span>
                        <span className="short">{g.short}</span>
                        {f && f.status !== 'natif' && (
                          <span className={`support ${f.status}`}>
                            {f.status === 'adapte'
                              ? `Adapté pour ${target?.label}`
                              : `Indisponible pour ${target?.label}`}
                          </span>
                        )}
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
              {generator && (
                <div className="glass mode-details">
                  <div className="mode-title">
                    <span className="accent">{generatorIcon(generator.key)}</span> {generator.label}
                  </div>
                  <div className="muted mode-description">{generator.description}</div>
                  {format && generator.usesFiles && (
                    <div className="mode-target">
                      <b className="accent">Pour {target?.label} :</b> {format.summary}
                    </div>
                  )}
                  <div className="section-label examples-label">Exemples à essayer</div>
                  {generator.examples.map((ex) => (
                    <button type="button" key={ex} className="example" onClick={() => setDraft(ex)}>
                      {ex}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            conversation.messages.map((m, i) => (
              <Message
                key={i}
                message={m}
                models={models}
                live={stream.active && i === conversation.messages.length - 1}
                isLast={i === conversation.messages.length - 1}
                onShowFiles={() => props.onShowFiles(i)}
                onRegenerate={stream.active ? undefined : props.onRegenerate}
              />
            ))
          )}
        </div>
      </div>

      <div className="composer-wrap">
        <div className="composer-alerts">
          {unavailable && (
            <Alert
              type="error"
              showIcon
              title={`${generator?.label} : indisponible pour ${target?.label}`}
              description={format?.summary}
            />
          )}
          {!unavailable && tooHeavy && (
            <Alert
              type="error"
              showIcon
              title={`« ${model?.label} » est trop lourd pour cette machine.`}
              description={model?.fit.reason}
              action={
                <Button size="small" onClick={() => props.onOpenPanel('model')}>
                  Choisir un autre modèle
                </Button>
              }
            />
          )}
          {!unavailable && !tooHeavy && modelMissing && (
            <Alert
              type="warning"
              showIcon
              title={`Le modèle « ${model?.label} » n’est pas encore sur cet ordinateur.`}
              action={
                <Button size="small" onClick={() => props.onOpenPanel('model')}>
                  Choisir ou télécharger
                </Button>
              }
            />
          )}
          {!cannotSend && needsProject && (
            <Alert
              type="info"
              showIcon
              title="Ce mode s’appuie sur un projet : sélectionne-le dans l’onglet Projets."
              action={
                <Button size="small" onClick={() => props.onOpenPanel('projects')}>
                  Projets
                </Button>
              }
            />
          )}
        </div>
        <Composer
          conversation={conversation}
          generator={generator}
          target={target}
          targetKey={targetKey}
          model={model}
          stream={stream}
          cannotSend={cannotSend}
          draft={draft}
          onDraftChange={setDraft}
          onSend={props.onSend}
          onStop={props.onStop}
          onOpenPanel={props.onOpenPanel}
        />
      </div>
    </main>
  );
}
