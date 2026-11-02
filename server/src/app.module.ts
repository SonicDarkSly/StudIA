import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { ConversationsModule } from './modules/conversations/conversations.module.js';
import { ModesModule } from './modules/modes/modes.module.js';
import { ModelsModule } from './modules/models/models.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';

@Module({
  imports: [ModelsModule, ProjectsModule, ModesModule, ConversationsModule],
  controllers: [HealthController],
})
export class AppModule {}
