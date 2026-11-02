import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { TARGETS, type AiTarget } from '../../domain/ai-target.js';
import type { Mode } from '../../domain/mode.js';
import { MODES } from '../../catalog/index.js';

export class ListModesQuery {}

export interface ModesOverview {
  modes: Mode[];
  targets: AiTarget[];
}

@QueryHandler(ListModesQuery)
export class ListModesHandler implements IQueryHandler<ListModesQuery, ModesOverview> {
  async execute(): Promise<ModesOverview> {
    return { modes: MODES, targets: TARGETS };
  }
}
