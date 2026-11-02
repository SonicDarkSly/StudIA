import { Controller, Get } from '@nestjs/common';
import { env } from './shared/config/env.js';

@Controller('api')
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('info')
  info() {
    return {
      name: 'StudIA',
      author: 'SonicDarkSly',
      license: 'Apache-2.0',
      lan: env().STUDIA_LAN,
      node: process.version,
    };
  }
}
