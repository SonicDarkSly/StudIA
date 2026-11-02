import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { findTarget } from '../../../modes/domain/ai-target.js';
import { findMode } from '../../../modes/catalog/index.js';
import { composeModePrompt } from '../../../modes/domain/compose-prompt.js';
import { ModelNotDownloadedError } from '../../../models/domain/catalog-model.js';
import { sanitizeSettings, type GenerationSettings } from '../../../models/domain/generation-settings.js';
import {
  LANGUAGE_MODEL_RUNTIME,
  type GenerationListener,
  type LanguageModelRuntime,
} from '../../../models/domain/language-model-runtime.js';
import {
  assessFit,
  MACHINE_PROBE,
  ModelTooLargeError,
  type MachineProbe,
} from '../../../models/domain/machine.js';
import { MODEL_CATALOG, type ModelCatalog } from '../../../models/domain/model-catalog.js';
import { MODEL_FILE_LOCATOR, type ModelFileLocator } from '../../../models/domain/model-file-locator.js';
import { PROJECT_REPOSITORY, type ProjectRepository } from '../../../projects/domain/project.repository.js';
import type { ChatMessage, MessageStats } from '../../domain/chat-message.js';
import { ReplyGeneratedEvent } from '../../domain/events/reply-generated.event.js';
import { buildSystemPrompt } from '../../domain/system-prompt.js';

const MAX_PROJECTS_PER_REPLY = 6;

export interface ReplyRequest {
  modelKey: string;
  modeKey?: string;
  targetKey?: string;
  projectNames?: string[];
  settings?: Partial<GenerationSettings>;
  extraInstructions?: string;
  messages: ChatMessage[];
}

export interface ReplyOutcome {
  stats: MessageStats;
  systemTokens: number;
}

export class InvalidChatRequestError extends Error {}

export class GenerateReplyCommand {
  constructor(
    readonly request: ReplyRequest,
    readonly listener: GenerationListener,
    readonly signal: AbortSignal,
  ) {}
}

@CommandHandler(GenerateReplyCommand)
export class GenerateReplyHandler implements ICommandHandler<GenerateReplyCommand, ReplyOutcome> {
  constructor(
    @Inject(MODEL_CATALOG) private readonly catalog: ModelCatalog,
    @Inject(MODEL_FILE_LOCATOR) private readonly locator: ModelFileLocator,
    @Inject(LANGUAGE_MODEL_RUNTIME) private readonly runtime: LanguageModelRuntime,
    @Inject(PROJECT_REPOSITORY) private readonly projects: ProjectRepository,
    @Inject(MACHINE_PROBE) private readonly machine: MachineProbe,
    private readonly events: EventBus,
  ) {}

  async execute({ request, listener, signal }: GenerateReplyCommand): Promise<ReplyOutcome> {
    const messages = (request.messages ?? []).filter(
      (m) => typeof m?.content === 'string' && m.content.trim(),
    );
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user')
      throw new InvalidChatRequestError('Le dernier message doit venir de l’utilisateur.');

    const model = this.catalog.get(request.modelKey);
    const located = this.locator.locate(model);
    if (!located) throw new ModelNotDownloadedError(model.label);
    const machine = await this.machine.profile();
    const fit = assessFit(model, machine);
    if (fit.level === 'trop-lourd' && !machine.limitsIgnored) throw new ModelTooLargeError(model.label, fit);

    const mode = findMode(request.modeKey);
    const target = findTarget(request.targetKey);
    const format = mode.formats[target.key];
    if (format.status === 'indisponible')
      throw new InvalidChatRequestError(`${mode.label} pour ${target.label} : ${format.summary}`);
    const modePrompt = composeModePrompt(mode, target);
    const settings = sanitizeSettings({ ...model.recommended, ...(request.settings ?? {}) });
    const projectNames = (request.projectNames ?? []).slice(0, MAX_PROJECTS_PER_REPLY);
    const extracts = projectNames.map((name) => {
      const { text } = this.projects.context(name);
      return { name, text };
    });

    const result = await this.runtime.generate(
      {
        model,
        path: located.path,
        settings,
        system: (contextSize) =>
          buildSystemPrompt(modePrompt, request.extraInstructions, extracts, contextSize),
        history: messages.slice(0, -1).map(({ role, content }) => ({ role, content })),
        prompt: last.content,
      },
      listener,
      signal,
    );

    const stats: MessageStats = {
      modelKey: model.key,
      promptTokens: result.promptTokens,
      outputTokens: result.outputTokens,
      contextUsed: result.contextUsed,
      contextSize: result.contextSize,
      seconds: result.seconds,
      firstTokenSeconds: result.firstTokenSeconds,
      tokensPerSecond: result.tokensPerSecond,
      stopReason: result.stopReason,
    };
    this.events.publish(new ReplyGeneratedEvent(mode.key, target.key, projectNames, stats));
    return { stats, systemTokens: result.systemTokens };
  }
}
