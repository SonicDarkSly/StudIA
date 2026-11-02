import type { ModeRules } from '@/types';
import { placeSkillFiles } from '@/modes/utils/skills';

export const SKILL_RULES: ModeRules = { requiresSkill: true, place: placeSkillFiles, check: () => [] };
