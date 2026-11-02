import { ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { useCallback, useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { ChatView } from './components/ChatView';
import { FilesPanel } from './components/FilesPanel';
import { HelpModal } from './components/HelpModal';
import { Logo } from './components/Logo';
import { ModelPanel } from './components/ModelPanel';
import { ProjectsPanel } from './components/ProjectsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { SidePanel } from './components/SidePanel';
import { Sidebar } from './components/Sidebar';
import { DEFAULT_MODE, DEFAULT_SETTINGS, DEFAULT_TARGET } from './consts';
import { newConversation, useChatSession } from './hooks/useChatSession';
import { useConversations } from './hooks/useConversations';
import { useModels } from './hooks/useModels';
import { useModes, useProjects } from './hooks/useStaticData';
import { useTheme } from './hooks/useTheme';
import { antdTheme } from './theme';
import type { GenerationSettings, ModeKey, PanelTab, TargetKey } from './types';
import { parseFiles } from './utils/files';
import { isBlocked } from './utils/models';
import { loadPreferredTarget, savePreferredTarget } from './utils/targets';

export default function App() {
  const { mode: themeMode, toggle } = useTheme();
  const { modes, targets } = useModes();
  const { models, runtime, machine, error: modelsError, download, cancel, unload, uninstall } = useModels();
  const [preferredTarget, setPreferredTarget] = useState<TargetKey>(loadPreferredTarget);
  const { projects, loading: projectsLoading, refresh: refreshProjects } = useProjects();
  const convs = useConversations();
  const { conversation, setConversation, update, stream, send, stop, regenerate } = useChatSession(
    convs.save,
  );
  const [tab, setTab] = useState<PanelTab>('model');
  const [showRight, setShowRight] = useState(true);
  const [help, setHelp] = useState(false);
  const [filesIndex, setFilesIndex] = useState<number>();

  const pickModel = useCallback(
    (modeKey: ModeKey) => {
      const g = modes.find((x) => x.key === modeKey);
      const usable = models.filter((m) => !isBlocked(m, machine));
      const preferred = usable.find((m) => m.key === g?.recommendedModel);
      if (preferred?.status === 'present') return preferred.key;
      return (
        usable.find((m) => m.status === 'present')?.key ??
        preferred?.key ??
        usable[0]?.key ??
        models[models.length - 1]?.key ??
        ''
      );
    },
    [modes, models, machine],
  );

  const chooseTarget = useCallback((key: TargetKey) => {
    setPreferredTarget(key);
    savePreferredTarget(key);
  }, []);

  const initialSettings = useCallback(
    (modeKey: ModeKey, modelKey: string): Partial<GenerationSettings> => ({
      ...(models.find((m) => m.key === modelKey)?.recommended ?? {}),
      ...(modes.find((g) => g.key === modeKey)?.recommendedSettings ?? {}),
    }),
    [modes, models],
  );

  const startNew = useCallback(
    (modeKey = DEFAULT_MODE, projectNames: string[] = [], targetKey: TargetKey = preferredTarget) => {
      const modelKey = pickModel(modeKey);
      setConversation(
        newConversation(modeKey, targetKey, modelKey, initialSettings(modeKey, modelKey), projectNames),
      );
      setFilesIndex(undefined);
    },
    [initialSettings, pickModel, preferredTarget, setConversation],
  );

  if (!conversation && modes.length && models.length) startNew();

  const model = models.find((m) => m.key === conversation?.modelKey);
  const mode = modes.find((g) => g.key === conversation?.modeKey);
  const settings: GenerationSettings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...(model?.recommended ?? {}), ...(conversation?.settings ?? {}) }),
    [model, conversation?.settings],
  );

  const lastWithFiles = useMemo(() => {
    const msgs = conversation?.messages ?? [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant' && parseFiles(msgs[i].content).files.length) return i;
    }
    return undefined;
  }, [conversation?.messages]);
  const shownIndex = filesIndex ?? lastWithFiles;
  const filesText = shownIndex !== undefined ? conversation?.messages[shownIndex]?.content : undefined;
  const fileCount = filesText ? parseFiles(filesText).files.length : 0;

  if (!conversation) {
    return (
      <ConfigProvider locale={frFR} theme={antdTheme('dark')}>
        <div className="studia-bg" aria-hidden />
        <main className="startup">
          <div className="startup-content">
            <h1 className="sr-only">StudIA</h1>
            <Logo />
            <p className="muted" role="status">
              {modelsError ? `Serveur injoignable : ${modelsError}` : 'Connexion au serveur local…'}
            </p>
          </div>
        </main>
      </ConfigProvider>
    );
  }

  const locked = conversation.messages.length > 0;
  const targetKey: TargetKey = conversation.targetKey ?? DEFAULT_TARGET;
  const changeTarget = (key: TargetKey) => {
    chooseTarget(key);
    if (conversation.messages.length) startNew(conversation.modeKey, conversation.projectNames, key);
    else update((c) => ({ ...c, targetKey: key }));
  };
  const changeMode = (key: ModeKey) => {
    const modelKey = pickModel(key);
    update((c) => ({ ...c, modeKey: key, modelKey, settings: initialSettings(key, modelKey) }));
  };
  const openPanel = (t: PanelTab) => {
    setShowRight(true);
    setTab(t);
  };

  return (
    <ConfigProvider locale={frFR} theme={antdTheme(themeMode)}>
      <a className="skip-link" href="#contenu">
        Aller à la conversation
      </a>
      <div className="studia-bg" aria-hidden />
      <div className={`studia-shell${showRight ? '' : ' no-right'}`}>
        <AppHeader
          themeMode={themeMode}
          machine={machine}
          runtime={runtime}
          models={models}
          showRight={showRight}
          onToggleTheme={toggle}
          onHelp={() => setHelp(true)}
          onToggleRight={() => setShowRight((v) => !v)}
          onOpenPanel={openPanel}
        />

        <Sidebar
          conversations={convs.list}
          activeId={conversation.id}
          modes={modes}
          onNew={() => startNew()}
          onOpen={async (id) => {
            if (stream.active) return;
            setConversation(await convs.load(id));
            setFilesIndex(undefined);
          }}
          onDelete={async (id) => {
            await convs.remove(id);
            if (id === conversation.id) startNew();
          }}
        />

        <ChatView
          conversation={conversation}
          modes={modes}
          targets={targets}
          models={models}
          machine={machine}
          stream={stream}
          onPickTarget={changeTarget}
          onPickMode={(key) => {
            if (locked) startNew(key, conversation.projectNames, targetKey);
            else changeMode(key);
          }}
          onSend={(text) => {
            setFilesIndex(undefined);
            void send(text);
          }}
          onStop={stop}
          onRegenerate={() => {
            setFilesIndex(undefined);
            void regenerate();
          }}
          onShowFiles={(i) => {
            setFilesIndex(i);
            openPanel('files');
          }}
          onOpenPanel={openPanel}
        />

        {showRight && (
          <SidePanel
            tab={tab}
            onTab={setTab}
            projectCount={conversation.projectNames.length}
            fileCount={fileCount}
            panels={{
              model: (
                <ModelPanel
                  models={models}
                  modes={modes}
                  runtime={runtime}
                  machine={machine}
                  selected={conversation.modelKey}
                  error={modelsError}
                  onSelect={(key) =>
                    update((c) => ({
                      ...c,
                      modelKey: key,
                      settings: { ...c.settings, ...initialSettings(c.modeKey, key) },
                    }))
                  }
                  onDownload={(key) => void download(key)}
                  onCancel={(key) => void cancel(key)}
                  onUnload={() => void unload()}
                  onUninstall={(key) => void uninstall(key)}
                />
              ),
              settings: (
                <SettingsPanel
                  modes={modes}
                  targets={targets}
                  modeKey={conversation.modeKey}
                  targetKey={targetKey}
                  onTarget={changeTarget}
                  model={model}
                  settings={settings}
                  extraInstructions={conversation.systemPrompt ?? ''}
                  locked={locked}
                  onMode={changeMode}
                  onChange={(patch) => update((c) => ({ ...c, settings: { ...c.settings, ...patch } }))}
                  onReset={() => update((c) => ({ ...c, settings: initialSettings(c.modeKey, c.modelKey) }))}
                  onInstructions={(text) => update((c) => ({ ...c, systemPrompt: text }))}
                />
              ),
              projects: (
                <ProjectsPanel
                  projects={projects}
                  loading={projectsLoading}
                  selected={conversation.projectNames}
                  contextSize={settings.contextSize}
                  onChange={(names) => update((c) => ({ ...c, projectNames: names }))}
                  onRefresh={() => void refreshProjects()}
                />
              ),
              files: (
                <FilesPanel
                  key={`${conversation.id}:${shownIndex ?? '-'}`}
                  text={filesText}
                  mode={mode}
                  targetKey={targetKey}
                  live={stream.active && shownIndex === conversation.messages.length - 1}
                />
              ),
            }}
          />
        )}
      </div>
      <HelpModal open={help} onClose={() => setHelp(false)} modes={modes} targets={targets} />
    </ConfigProvider>
  );
}
