import 'reflect-metadata';
import { createWriteStream, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'express';
import { AppModule } from './app.module.js';
import { env, loadEnv } from './shared/config/env.js';
import { SERVER_ROOT } from './shared/config/paths.js';
import { FileTeeLogger } from './shared/logging/file-tee.logger.js';

async function bootstrap(): Promise<void> {
  loadEnv(join(SERVER_ROOT, '.env'));
  const { PORT: port, STUDIA_LAN: lan } = env();
  const host = lan ? '0.0.0.0' : '127.0.0.1';

  const logDir = join(SERVER_ROOT, 'logs');
  mkdirSync(logDir, { recursive: true });
  const logger = new FileTeeLogger(createWriteStream(join(logDir, 'studia.log'), { flags: 'a' }));

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger });
  app.use(json({ limit: '8mb' }));
  app.set('etag', false);
  await app.listen(port, host);

  const config = new Logger('Config');
  config.log('StudIA, par SonicDarkSly, licence Apache 2.0');
  config.log(`Serveur démarré sur http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
  if (host === '0.0.0.0')
    config.warn(
      'Accès réseau local activé (STUDIA_LAN=1) : le code des projets devient lisible depuis le Wi-Fi.',
    );
}

void bootstrap();
