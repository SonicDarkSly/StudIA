import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ListGeneratorsQuery,
  type GeneratorsOverview,
} from '../application/queries/list-generators.query.js';

@Controller('api/generators')
export class GeneratorsController {
  constructor(private readonly queries: QueryBus) {}

  @Get()
  list(): Promise<GeneratorsOverview> {
    return this.queries.execute(new ListGeneratorsQuery());
  }
}
