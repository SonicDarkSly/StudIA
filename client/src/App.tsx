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
import { DEFAULT_GENERATOR, DEFAULT_SETTINGS, DEFAULT_TARGET } from './consts';
import { newConversation, useChatSession } from './hooks/useChatSession';
import { useConversations } from './hooks/useConversations';
import { useModels } from './hooks/useModels';
import { useGenerators, useProjects } from './hooks/useStaticData';
import { useTheme } from './hooks/useTheme';
import { antdTheme } from './theme';
import type { GenerationSettings, GeneratorKey, PanelTab, TargetKey } from './types';
import { parseFiles } from './utils/files';
import { isBlocked } from './utils/models';
import { loadPreferredTarget, savePreferredTarget } from './utils/targets';

export default function App() {
  const { mode, toggle } = useTheme();
  const { generators, targets } = useGenerators();
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
    (generatorKey: GeneratorKey) => {
      const g = generators.find((x) => x.key === generatorKey);
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
    [generators, models, machine],
  );

  const chooseTarget = useCallback((key: TargetKey) => {
    setPreferredTarget(key);
    savePreferredTarget(key);
  }, []);

  const initialSettings = useCallback(
    (generatorKey: GeneratorKey, modelKey: string): Partial<GenerationSettings> => ({
      ...(models.find((m) => m.key === modelKey)?.recommended ?? {}),
      ...(generators.find((g) => g.key === generatorKey)?.recommendedSettings ?? {}),
    }),
    [generators, models],
  );

  const startNew = useCallback(
    (
      generatorKey = DEFAULT_GENERATOR,
      projectNames: string[] = [],
      targetKey: TargetKey = preferredTarget,
    ) => {
      const modelKey = pickModel(generatorKey);
      setConversation(
        newConversation(
          generatorKey,
          targetKey,
          modelKey,
          initialSettings(generatorKey, modelKey),
          projectNames,
        ),
      );
      setFilesIndex(undefined);
    },
    [initialSettings, pickModel, preferredTarget, setConversation],
  );

  if (!conversation && generators.length && models.length) startNew();

  const model = models.find((m) => m.key === conversation?.modelKey);
  const generator = generators.find((g) => g.key === conversation?.generatorKey);
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
    if (conversation.messages.length) startNew(conversation.generatorKey, conversation.projectNames, key);
    else update((c) => ({ ...c, targetKey: key }));
  };
  const changeGenerator = (key: GeneratorKey) => {
    const modelKey = pickModel(key);
    update((c) => ({ ...c, generatorKey: key, modelKey, settings: initialSettings(key, modelKey) }));
  };
  const openPanel = (t: PanelTab) => {
    setShowRight(true);
    setTab(t);
  };

  return (
    <ConfigProvider locale={frFR} theme={antdTheme(mode)}>
      <a className="skip-link" href="#contenu">
        Aller à la conversation
      </a>
      <div className="studia-bg" aria-hidden />
      <div className={`studia-shell${showRight ? '' : ' no-right'}`}>
        <AppHeader
          mode={mode}
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
          generators={generators}
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
          generators={generators}
          targets={targets}
          models={models}
          machine={machine}
          stream={stream}
          onPickTarget={changeTarget}
          onPickGenerator={(key) => {
            if (locked) startNew(key, conversation.projectNames, targetKey);
            else changeGenerator(key);
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
                  generators={generators}
                  runtime={runtime}
                  machine={machine}
                  selected={conversation.modelKey}
                  error={modelsError}
                  onSelect={(key) =>
                    update((c) => ({
                      ...c,
                      modelKey: key,
                      settings: { ...c.settings, ...initialSettings(c.generatorKey, key) },
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
                  generators={generators}
                  targets={targets}
                  generatorKey={conversation.generatorKey}
                  targetKey={targetKey}
                  onTarget={changeTarget}
                  model={model}
                  settings={settings}
                  extraInstructions={conversation.systemPrompt ?? ''}
                  locked={locked}
                  onGenerator={changeGenerator}
                  onChange={(patch) => update((c) => ({ ...c, settings: { ...c.settings, ...patch } }))}
                  onReset={() =>
                    update((c) => ({ ...c, settings: initialSettings(c.generatorKey, c.modelKey) }))
                  }
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
                  generator={generator}
                  targetKey={targetKey}
                  live={stream.active && shownIndex === conversation.messages.length - 1}
                />
              ),
            }}
          />
        )}
      </div>
      <HelpModal open={help} onClose={() => setHelp(false)} generators={generators} targets={targets} />
    </ConfigProvider>
  );
}
