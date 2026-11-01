import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { ConversationsModule } from './modules/conversations/conversations.module.js';
import { GeneratorsModule } from './modules/generators/generators.module.js';
import { ModelsModule } from './modules/models/models.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';

@Module({
  imports: [ModelsModule, ProjectsModule, GeneratorsModule, ConversationsModule],
  controllers: [HealthController],
})
export class AppModule {}
