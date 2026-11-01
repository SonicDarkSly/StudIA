import { join } from 'node:path';

export const SERVER_ROOT = join(__dirname, '..', '..', '..');
export const REPO_ROOT = join(SERVER_ROOT, '..');
export const DATA_DIR = join(SERVER_ROOT, 'data');
export const LLM_DIR = join(DATA_DIR, 'llm');
export const CONVERSATIONS_DIR = join(DATA_DIR, 'conversations');
export const PROJECTS_FILE = join(DATA_DIR, 'projects.json');
export const MODELS_FILE = join(SERVER_ROOT, 'models.json');
