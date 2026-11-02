import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ListModesQuery, type ModesOverview } from '../application/queries/list-modes.query.js';

@Controller('api/modes')
export class ModesController {
  constructor(private readonly queries: QueryBus) {}

  @Get()
  list(): Promise<ModesOverview> {
    return this.queries.execute(new ListModesQuery());
  }
}
