import type { FileIssue, GeneratedFile, ModeCompanion, ModeKey, ModeRules, TargetFormat } from '@/types';
import { checkSkills, hasSkillFile } from './utils/skills';
import { AGENT_RULES } from './agent/agent.rules';
import { CHAT_RULES } from './chat/chat.rules';
import { INSTRUCTIONS_RULES } from './instructions/instructions.rules';
import { COMMAND_RULES } from './command/command.rules';
import { HOOKS_RULES } from './hooks/hooks.rules';
import { MCP_RULES } from './mcp/mcp.rules';
import { PLUGIN_RULES } from './plugin/plugin.rules';
import { SKILL_RULES } from './skill/skill.rules';

const MODE_RULES: Record<ModeKey, ModeRules> = {
  chat: CHAT_RULES,
  skill: SKILL_RULES,
  mcp: MCP_RULES,
  command: COMMAND_RULES,
  agent: AGENT_RULES,
  instructions: INSTRUCTIONS_RULES,
  hooks: HOOKS_RULES,
  plugin: PLUGIN_RULES,
};

export const placeFiles = (key: ModeKey, files: GeneratedFile[], format?: TargetFormat): GeneratedFile[] =>
  MODE_RULES[key].place?.(files, format) ?? files;

export function checkModeFiles(key: ModeKey, files: GeneratedFile[], format?: TargetFormat): FileIssue[] {
  const rules = MODE_RULES[key];
  const skillIssues = rules.requiresSkill || hasSkillFile(files) ? checkSkills(files, format) : [];
  return [...skillIssues, ...rules.check(files, format)];
}

export const modeCompanion = (key: ModeKey, files: GeneratedFile[]): ModeCompanion | undefined =>
  MODE_RULES[key].companion?.(files);
