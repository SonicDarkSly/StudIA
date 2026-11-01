import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { TARGETS, type AiTarget } from '../../domain/ai-target.js';
import type { Generator } from '../../domain/generator.js';
import { GENERATORS } from '../../domain/generator-catalog.js';

export class ListGeneratorsQuery {}

export interface GeneratorsOverview {
  generators: Generator[];
  targets: AiTarget[];
}

@QueryHandler(ListGeneratorsQuery)
export class ListGeneratorsHandler implements IQueryHandler<ListGeneratorsQuery, GeneratorsOverview> {
  async execute(): Promise<GeneratorsOverview> {
    return { generators: GENERATORS, targets: TARGETS };
  }
}
