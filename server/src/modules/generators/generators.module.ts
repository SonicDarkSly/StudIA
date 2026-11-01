import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ListGeneratorsHandler } from './application/queries/list-generators.query.js';
import { GeneratorsController } from './api/generators.controller.js';

@Module({
  imports: [CqrsModule],
  controllers: [GeneratorsController],
  providers: [ListGeneratorsHandler],
})
export class GeneratorsModule {}
