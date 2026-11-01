import type { MachineProfile, ModelView } from '../types';

export function isBlocked(model: ModelView | undefined, machine: MachineProfile | undefined): boolean {
  return !!model && model.fit.level === 'trop-lourd' && !machine?.limitsIgnored;
}
