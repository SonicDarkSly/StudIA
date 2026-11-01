import { Controller, Get } from '@nestjs/common';

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
      lan: process.env.STUDIA_LAN === '1',
      node: process.version,
    };
  }
}
