import { MODE_KEYS, type Mode, type ModeKey } from '../domain/mode.js';
import { AGENT_MODE } from './agent/agent.mode.js';
import { CHAT_MODE } from './chat/chat.mode.js';
import { COMMAND_MODE } from './command/command.mode.js';
import { HOOKS_MODE } from './hooks/hooks.mode.js';
import { INSTRUCTIONS_MODE } from './instructions/instructions.mode.js';
import { MCP_MODE } from './mcp/mcp.mode.js';
import { PLUGIN_MODE } from './plugin/plugin.mode.js';
import { SKILL_MODE } from './skill/skill.mode.js';

const MODE_REGISTRY: Record<ModeKey, Mode> = {
  chat: CHAT_MODE,
  skill: SKILL_MODE,
  mcp: MCP_MODE,
  command: COMMAND_MODE,
  agent: AGENT_MODE,
  instructions: INSTRUCTIONS_MODE,
  hooks: HOOKS_MODE,
  plugin: PLUGIN_MODE,
};

export const MODES: Mode[] = MODE_KEYS.map((key) => MODE_REGISTRY[key]);

export function findMode(key: string | undefined): Mode {
  return MODES.find((g) => g.key === key) ?? MODES[0];
}
