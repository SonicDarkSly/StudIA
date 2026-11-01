import { Injectable, Logger } from '@nestjs/common';
import { cpus, freemem, totalmem } from 'node:os';
import { llamaInstance } from '../../../shared/config/esm.js';
import {
  osReserveGb,
  roundToTenth,
  type GpuBackend,
  type MachineProbe,
  type MachineProfile,
} from '../domain/machine.js';

const BYTES_PER_GB = 1_073_741_824;

@Injectable()
export class NodeMachineProbe implements MachineProbe {
  private readonly logger = new Logger('Machine');
  private gpu: Promise<{ gpu?: GpuBackend; names: string[]; vramGb?: number }> | undefined;

  async profile(): Promise<MachineProfile> {
    const override = Number(process.env.STUDIA_MEMORY_GB);
    const memoryOverridden = Number.isFinite(override) && override > 0;
    const totalRamGb = roundToTenth(memoryOverridden ? override : totalmem() / BYTES_PER_GB);
    const unifiedMemory = process.platform === 'darwin' && process.arch === 'arm64';
    const { gpu, names, vramGb } = await this.detectGpu();
    const scaledVram =
      vramGb !== undefined && memoryOverridden && unifiedMemory
        ? roundToTenth((vramGb * totalRamGb) / (totalmem() / BYTES_PER_GB))
        : vramGb;
    return {
      platform: process.platform,
      arch: process.arch,
      cpu: cpus()[0]?.model?.trim() || 'processeur inconnu',
      cores: cpus().length,
      totalRamGb,
      freeRamGb: roundToTenth(freemem() / BYTES_PER_GB),
      gpu,
      gpuNames: names,
      vramGb: scaledVram,
      unifiedMemory,
      usableGb: roundToTenth(totalRamGb - osReserveGb(totalRamGb)),
      memoryOverridden,
      limitsIgnored: process.env.STUDIA_IGNORE_LIMITS === '1',
    };
  }

  private detectGpu() {
    this.gpu ??= (async () => {
      try {
        const llama = await llamaInstance();
        const gpu = llama.gpu || undefined;
        if (!gpu) return { names: [] };
        const vram = await llama.getVramState();
        const names: string[] = await llama.getGpuDeviceNames().catch(() => []);
        const result = {
          gpu,
          names,
          vramGb: vram?.total ? roundToTenth(vram.total / BYTES_PER_GB) : undefined,
        };
        this.logger.log(
          `processeur graphique : ${gpu}${names.length ? ` (${names.join(', ')})` : ''}, ${result.vramGb ?? '?'} Go`,
        );
        return result;
      } catch (err) {
        this.logger.warn(
          `détection du processeur graphique impossible : ${err instanceof Error ? err.message : String(err)}`,
        );
        return { names: [] };
      }
    })();
    return this.gpu;
  }
}
