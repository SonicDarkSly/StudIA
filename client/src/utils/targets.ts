import { DEFAULT_TARGET } from '@/consts';
import type { TargetKey } from '@/types';

const TARGET_KEYS: readonly TargetKey[] = [
  'claude',
  'codex',
  'copilot',
  'cursor',
  'gemini',
  'antigravity',
  'portable',
];
const STORAGE_KEY = 'studia-target';

export function isTargetKey(value: unknown): value is TargetKey {
  return TARGET_KEYS.some((key) => key === value);
}

export function loadPreferredTarget(): TargetKey {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isTargetKey(saved) ? saved : DEFAULT_TARGET;
  } catch {
    return DEFAULT_TARGET;
  }
}

export function savePreferredTarget(key: TargetKey): void {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {}
}
