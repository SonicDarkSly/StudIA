import type { ModeRules } from '@/types';
import { checkHeaders } from '@/modes/utils/headers';
import { hasSkillFile } from '@/modes/utils/skills';

export const AGENT_RULES: ModeRules = {
  check: (files) => (hasSkillFile(files) ? [] : checkHeaders(files, true)),
};
