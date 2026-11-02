import { describe, expect, it } from 'vitest';
import { chatRequestSchema } from '../../server/src/modules/conversations/api/chat-request.schema.js';
import {
  Conversation,
  conversationInputSchema,
} from '../../server/src/modules/conversations/domain/conversation.js';
import { projectPathSchema } from '../../server/src/modules/projects/api/project-path.schema.js';
import { projectNameSchema } from '../../server/src/modules/projects/api/project-name.schema.js';
import { modelKeySchema } from '../../server/src/modules/models/api/model-key.schema.js';
import { conversationIdSchema } from '../../server/src/modules/conversations/api/conversation-id.schema.js';
import { readEnv } from '../../server/src/shared/config/env.js';

const VALID_ID = 'abcdefgh-1234';
const DEFAULT_PORT = 3003;

describe('demande de génération', () => {
  it('accepte une demande complète', () => {
    const result = chatRequestSchema.safeParse({
      modelKey: 'qwen3-30b',
      modeKey: 'skill',
      targetKey: 'claude',
      settings: { temperature: 0.4, thinking: false },
      messages: [{ role: 'user', content: 'Bonjour' }],
    });
    expect(result.success).toBe(true);
  });

  it('refuse une demande sans message', () => {
    expect(chatRequestSchema.safeParse({ modelKey: 'qwen3-30b', messages: [] }).success).toBe(false);
  });

  it('refuse un rôle ou un réglage du mauvais type', () => {
    const result = chatRequestSchema.safeParse({
      modelKey: 'qwen3-30b',
      settings: { temperature: 'chaud' },
      messages: [{ role: 'robot', content: 'x' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('conversation', () => {
  it('écarte un message invalide sans perdre la conversation', () => {
    const parsed = conversationInputSchema.parse({
      id: VALID_ID,
      messages: [{ role: 'user', content: 'ok' }, { role: 'robot', content: 'ignoré' }, 'texte libre'],
    });
    expect(Conversation.restore(parsed).snapshot().messages).toEqual([{ role: 'user', content: 'ok' }]);
  });

  it('ignore des réglages illisibles', () => {
    const parsed = conversationInputSchema.parse({
      id: VALID_ID,
      settings: { temperature: 'x' },
      messages: [],
    });
    expect(Conversation.restore(parsed).snapshot().settings).toEqual({});
  });

  it('rouvre une ancienne conversation (generatorKey claudemd) dans le mode instructions', () => {
    const parsed = conversationInputSchema.parse({ id: VALID_ID, generatorKey: 'claudemd', messages: [] });
    expect(Conversation.restore(parsed).snapshot().modeKey).toBe('instructions');
  });

  it('refuse des messages qui ne sont pas une liste', () => {
    expect(conversationInputSchema.safeParse({ id: VALID_ID, messages: 'non' }).success).toBe(false);
  });
});

describe('ajout de projet', () => {
  it('refuse un chemin qui n’est pas une chaîne', () => {
    expect(projectPathSchema.safeParse({ path: 123 }).success).toBe(false);
  });
});

describe('paramètres des routes', () => {
  it('identifiant de conversation', () => {
    expect(conversationIdSchema.safeParse(VALID_ID).success).toBe(true);
    expect(conversationIdSchema.safeParse('../secret').success).toBe(false);
  });

  it('clé de modèle', () => {
    expect(modelKeySchema.safeParse('qwen3-coder-30b').success).toBe(true);
    expect(modelKeySchema.safeParse('../models').success).toBe(false);
  });

  it('nom de projet', () => {
    expect(projectNameSchema.safeParse('Claude outputs').success).toBe(true);
    expect(projectNameSchema.safeParse('..').success).toBe(false);
    expect(projectNameSchema.safeParse('a/b').success).toBe(false);
  });
});

describe("variables d'environnement", () => {
  it('donne les valeurs par défaut quand rien n’est défini', () => {
    expect(readEnv({})).toEqual({
      PORT: DEFAULT_PORT,
      STUDIA_LAN: false,
      STUDIA_IDLE_MINUTES: 10,
      STUDIA_IGNORE_LIMITS: false,
      STUDIA_EXTRA_MODEL_DIRS: [],
    });
  });

  it('convertit les valeurs du fichier .env', () => {
    const result = readEnv({
      PORT: '4000',
      STUDIA_LAN: '1',
      STUDIA_IDLE_MINUTES: '0',
      STUDIA_MEMORY_GB: '24',
      STUDIA_IGNORE_LIMITS: '0',
      STUDIA_EXTRA_MODEL_DIRS: '/Volumes/a ; /Volumes/b,',
    });
    expect(result).toEqual({
      PORT: 4000,
      STUDIA_LAN: true,
      STUDIA_IDLE_MINUTES: 0,
      STUDIA_MEMORY_GB: 24,
      STUDIA_IGNORE_LIMITS: false,
      STUDIA_EXTRA_MODEL_DIRS: ['/Volumes/a', '/Volumes/b'],
    });
  });

  it('ignore une variable vide', () => {
    expect(readEnv({ STUDIA_MEMORY_GB: '', PORT: '' }).PORT).toBe(DEFAULT_PORT);
  });

  it('refuse une valeur invalide avec le nom de la variable', () => {
    expect(() => readEnv({ PORT: 'abc' })).toThrow(/PORT/);
    expect(() => readEnv({ STUDIA_LAN: 'oui' })).toThrow(/STUDIA_LAN/);
    expect(() => readEnv({ STUDIA_MEMORY_GB: '-2' })).toThrow(/STUDIA_MEMORY_GB/);
  });
});
