import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ListModesHandler } from './application/queries/list-modes.query.js';
import { ModesController } from './api/modes.controller.js';

@Module({
  imports: [CqrsModule],
  controllers: [ModesController],
  providers: [ListModesHandler],
})
export class ModesModule {}
