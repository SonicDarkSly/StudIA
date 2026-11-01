import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { llamaCpp, llamaInstance } from '../../../shared/config/esm.js';
import { MS_PER_MINUTE } from '../../../shared/consts.js';
import { secondsSince } from '../../../shared/time.js';
import type { ChatHistoryItem, LlamaModel } from 'node-llama-cpp';
import type { CatalogModel } from '../domain/catalog-model.js';
import type {
  GenerationListener,
  GenerationRequest,
  GenerationResult,
  LanguageModelRuntime,
  RuntimeStatus,
} from '../domain/language-model-runtime.js';

const DEFAULT_IDLE_MINUTES = 10;

interface LoadedModel {
  key: string;
  model: LlamaModel;
  gpuLayers: number;
  totalLayers: number;
  trainContextSize: number;
}

@Injectable()
export class LlamaRuntime implements LanguageModelRuntime, OnModuleDestroy {
  private readonly logger = new Logger('Moteur');
  private current: { key: string; ready: Promise<LoadedModel> } | undefined;
  private loaded: LoadedModel | undefined;
  private loadingKey: string | undefined;
  private queue: Promise<unknown> = Promise.resolve();
  private running = 0;
  private idleTimer: NodeJS.Timeout | undefined;
  private readonly idleMinutes = Number(process.env.STUDIA_IDLE_MINUTES ?? DEFAULT_IDLE_MINUTES);

  status(): RuntimeStatus {
    return {
      loadedKey: this.loaded?.key,
      loadingKey: this.loadingKey,
      busy: this.running > 0,
      gpuLayers: this.loaded?.gpuLayers,
      totalLayers: this.loaded?.totalLayers,
      trainContextSize: this.loaded?.trainContextSize,
      idleMinutes: this.idleMinutes,
    };
  }

  generate(
    request: GenerationRequest,
    listener: GenerationListener,
    signal: AbortSignal,
  ): Promise<GenerationResult> {
    if (this.running > 0) listener.phase('queued');
    const job = this.queue.then(async () => {
      this.running++;
      this.clearIdle();
      try {
        if (signal.aborted) return this.emptyResult();
        if (this.loaded?.key !== request.model.key) listener.phase('loading', request.model.label);
        const loaded = await this.ensure(request.model, request.path);
        return await this.run(loaded, request, listener, signal);
      } finally {
        this.running--;
        this.armIdle();
      }
    });
    this.queue = job.catch(() => undefined);
    return job;
  }

  async unload(): Promise<void> {
    const previous = this.current;
    this.current = undefined;
    this.loaded = undefined;
    if (!previous) return;
    try {
      const { model } = await previous.ready;
      await model.dispose();
      this.logger.log(`modèle « ${previous.key} » libéré`);
    } catch {}
  }

  async onModuleDestroy(): Promise<void> {
    await this.unload();
  }

  private async run(
    loaded: LoadedModel,
    { model, settings, system: buildSystem, history, prompt }: GenerationRequest,
    listener: GenerationListener,
    signal: AbortSignal,
  ): Promise<GenerationResult> {
    const nlc = await llamaCpp();
    const contextSize = Math.min(settings.contextSize, loaded.trainContextSize || settings.contextSize);
    const system = buildSystem(contextSize);
    listener.phase('reading');

    const context = await loaded.model.createContext({ contextSize });
    try {
      const chatWrapper =
        model.thinking && !model.thinkingAlways
          ? nlc.resolveChatWrapper(loaded.model, {
              customWrapperSettings: { qwen: { thoughts: settings.thinking ? 'auto' : 'discourage' } },
            })
          : undefined;
      const session = new nlc.LlamaChatSession({
        contextSequence: context.getSequence(),
        ...(chatWrapper ? { chatWrapper } : {}),
      });
      const chatHistory: ChatHistoryItem[] = [
        { type: 'system', text: system },
        ...history.map((m): ChatHistoryItem =>
          m.role === 'user' ? { type: 'user', text: m.content } : { type: 'model', response: [m.content] },
        ),
      ];
      session.setChatHistory(chatHistory);

      const started = Date.now();
      let firstToken: number | undefined;
      let thought = '';
      let text = '';
      let phase: 'thinking' | 'writing' | undefined;
      const penalize =
        settings.repeatPenalty > 1 || settings.frequencyPenalty > 0 || settings.presencePenalty > 0;

      const meta = await session.promptWithMeta(prompt, {
        temperature: settings.temperature,
        topP: settings.topP,
        topK: settings.topK,
        minP: settings.minP,
        maxTokens: settings.maxTokens,
        ...(settings.seed !== undefined ? { seed: settings.seed } : {}),
        repeatPenalty: penalize
          ? {
              penalty: settings.repeatPenalty,
              frequencyPenalty: settings.frequencyPenalty || undefined,
              presencePenalty: settings.presencePenalty || undefined,
              lastTokens: settings.repeatLastTokens,
            }
          : false,
        ...(model.thinking && settings.thinking && settings.thoughtBudget !== undefined
          ? { budgets: { thoughtTokens: settings.thoughtBudget } }
          : {}),
        signal,
        stopOnAbortSignal: true,
        onResponseChunk: (chunk) => {
          if (!chunk.text) return;
          firstToken ??= Date.now();
          if (chunk.type === 'segment' && chunk.segmentType === 'thought') {
            if (phase !== 'thinking') listener.phase((phase = 'thinking'));
            thought += chunk.text;
            listener.thought(chunk.text);
          } else if (chunk.type === undefined) {
            if (phase !== 'writing') listener.phase((phase = 'writing'));
            text += chunk.text;
            listener.text(chunk.text);
          }
        },
      });

      const seconds = secondsSince(started);
      const outputTokens: number = loaded.model.tokenize(thought + text).length;
      const contextUsed: number = session.sequence?.contextTokens?.length ?? 0;
      const writing = firstToken ? secondsSince(firstToken) : seconds;
      return {
        text,
        thought,
        promptTokens: Math.max(0, contextUsed - outputTokens),
        outputTokens,
        systemTokens: loaded.model.tokenize(system).length,
        contextUsed,
        contextSize: context.contextSize ?? contextSize,
        seconds,
        firstTokenSeconds: firstToken ? secondsSince(started, firstToken) : undefined,
        tokensPerSecond: writing > 0 ? outputTokens / writing : 0,
        stopReason: signal.aborted ? 'abort' : meta.stopReason,
      };
    } finally {
      await context.dispose();
    }
  }

  private emptyResult(): GenerationResult {
    return {
      text: '',
      thought: '',
      promptTokens: 0,
      outputTokens: 0,
      systemTokens: 0,
      contextUsed: 0,
      contextSize: 0,
      seconds: 0,
      tokensPerSecond: 0,
      stopReason: 'abort',
    };
  }

  private async ensure(model: CatalogModel, path: string): Promise<LoadedModel> {
    if (this.current?.key === model.key) return this.current.ready;
    await this.unload();
    this.loadingKey = model.key;
    const ready = (async () => {
      const started = Date.now();
      this.logger.log(`chargement de « ${model.label} »…`);
      const llama = await llamaInstance();
      const m = await llama.loadModel({ modelPath: path });
      const loaded: LoadedModel = {
        key: model.key,
        model: m,
        gpuLayers: m.gpuLayers ?? 0,
        totalLayers: m.fileInsights?.totalLayers ?? 0,
        trainContextSize: m.trainContextSize ?? 0,
      };
      this.logger.log(
        `« ${model.label} » prêt en ${secondsSince(started).toFixed(1)} s · ` +
          `GPU ${loaded.gpuLayers}/${loaded.totalLayers || '?'} couches · contexte max ${loaded.trainContextSize}`,
      );
      return loaded;
    })();
    this.current = { key: model.key, ready };
    try {
      this.loaded = await ready;
      return this.loaded;
    } catch (err) {
      if (this.current?.key === model.key) this.current = undefined;
      throw err;
    } finally {
      this.loadingKey = undefined;
    }
  }

  private clearIdle(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = undefined;
  }

  private armIdle(): void {
    this.clearIdle();
    if (this.idleMinutes <= 0) return;
    this.idleTimer = setTimeout(() => {
      if (this.running === 0) void this.unload();
    }, this.idleMinutes * MS_PER_MINUTE);
    this.idleTimer.unref();
  }
}
