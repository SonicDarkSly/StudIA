import type { GenerationSettings } from './generation-settings.js';
import type { ModelFit } from './machine.js';

export interface CatalogModel {
  key: string;
  label: string;
  publisher: string;
  family: string;
  sizeGb: number;
  ramGb: number;
  capabilities: string[];
  idealFor: string[];
  description: string;
  pros: string;
  cons: string;
  license: string;
  uris: string[];
  thinking: boolean;
  thinkingAlways?: boolean;
  recommended: Partial<GenerationSettings>;
}

export type ModelStatus = 'absent' | 'present' | 'downloading' | 'error';

export interface ModelView extends Omit<CatalogModel, 'uris'> {
  status: ModelStatus;
  foundIn?: string;
  progress?: number;
  error?: string;
  loaded: boolean;
  fit: ModelFit;
}

export class UnknownModelError extends Error {
  constructor(readonly key: string) {
    super(`Modèle inconnu : ${key}`);
  }
}

export class ModelNotDownloadedError extends Error {
  constructor(readonly label: string) {
    super(
      `Le modèle « ${label} » n'est pas encore sur cet ordinateur : téléchargez-le depuis le panneau Modèle.`,
    );
  }
}

export class ModelOutsideStudiaError extends Error {
  constructor(
    readonly label: string,
    readonly owner: string,
  ) {
    super(
      `« ${label} » se trouve dans « ${owner} », hors de StudIA : StudIA ne modifie jamais un dossier qui ne lui appartient pas, supprimez le fichier depuis cet endroit.`,
    );
  }
}

export class ModelInUseError extends Error {
  constructor(readonly label: string) {
    super(`« ${label} » est en train de répondre : réessayez une fois la génération terminée.`);
  }
}

export function expectedFileName(uri: string): string | undefined {
  const m = uri.match(/^hf:([^/]+)\/([^:]+):(.+)$/);
  if (!m) return undefined;
  const [, user, repo, quant] = m;
  return `hf_${user}_${repo.replace(/-GGUF$/i, '')}.${quant}.gguf`;
}

export function filePrefix(uri: string): string | undefined {
  const m = uri.match(/^hf:([^/]+)\/([^:]+)$/);
  if (!m) return undefined;
  return `hf_${m[1]}_${m[2].replace(/-GGUF$/i, '')}`.toLowerCase();
}
