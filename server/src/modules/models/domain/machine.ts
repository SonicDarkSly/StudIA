import type { CatalogModel } from './catalog-model.js';

export type GpuBackend = 'metal' | 'cuda' | 'vulkan';

export interface MachineProfile {
  platform: string;
  arch: string;
  cpu: string;
  cores: number;
  totalRamGb: number;
  freeRamGb: number;
  gpu?: GpuBackend;
  gpuNames: string[];
  vramGb?: number;
  unifiedMemory: boolean;
  usableGb: number;
  memoryOverridden: boolean;
  limitsIgnored: boolean;
}

export type FitLevel = 'ok' | 'limite' | 'trop-lourd';

export interface ModelFit {
  level: FitLevel;
  needGb: number;
  reason: string;
}

export interface MachineProbe {
  profile(): Promise<MachineProfile>;
}

export const MACHINE_PROBE = Symbol('MACHINE_PROBE');

export class ModelTooLargeError extends Error {
  constructor(
    readonly label: string,
    readonly fit: ModelFit,
  ) {
    super(`« ${label} » est trop lourd pour cette machine : ${fit.reason}`);
  }
}

const RUNTIME_OVERHEAD_GB = 1.5;
const OS_RESERVE_SHARE = 0.15;
const MIN_OS_RESERVE_GB = 3;
const CPU_ONLY_COMFORT_GB = 7;
const TENTHS = 10;

export const roundToTenth = (n: number): number => Math.round(n * TENTHS) / TENTHS;

export function osReserveGb(totalRamGb: number): number {
  return Math.max(MIN_OS_RESERVE_GB, roundToTenth(totalRamGb * OS_RESERVE_SHARE));
}

const gb = (n: number) => `${n.toFixed(1).replace('.', ',')} Go`;

export function assessFit(model: Pick<CatalogModel, 'sizeGb'>, machine: MachineProfile): ModelFit {
  const needGb = roundToTenth(model.sizeGb + RUNTIME_OVERHEAD_GB);
  const usable = machine.usableGb;
  if (needGb > usable)
    return {
      level: 'trop-lourd',
      needGb,
      reason: `il faut environ ${gb(needGb)}, la machine peut en consacrer ${gb(usable)} aux modèles.`,
    };
  if (machine.gpu && machine.vramGb !== undefined) {
    if (needGb <= machine.vramGb)
      return {
        level: 'ok',
        needGb,
        reason: `tient entièrement sur le processeur graphique (${gb(needGb)} sur ${gb(machine.vramGb)}).`,
      };
    return {
      level: 'limite',
      needGb,
      reason: machine.unifiedMemory
        ? `tient en mémoire mais dépasse la part réservée au graphique (${gb(machine.vramGb)}) : plus lent, fermez les autres applications.`
        : `dépasse la mémoire de la carte graphique (${gb(machine.vramGb)}) : une partie tournera sur le processeur, plus lentement.`,
    };
  }
  if (needGb > CPU_ONLY_COMFORT_GB)
    return {
      level: 'limite',
      needGb,
      reason: 'pas de processeur graphique utilisable : le modèle tournera sur le processeur, lentement.',
    };
  return { level: 'ok', needGb, reason: 'tourne sur le processeur, à une vitesse correcte pour sa taille.' };
}
